package ru.sportplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.Event;
import ru.sportplatform.domain.entity.EventParticipation;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.entity.VkAccountLink;
import ru.sportplatform.domain.enums.Enums.ParticipationStatus;
import ru.sportplatform.domain.enums.Enums.VkDeliveryStatus;
import ru.sportplatform.dto.ApiDtos.VkStatusDto;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.EventParticipationRepository;
import ru.sportplatform.repository.UserRepository;
import ru.sportplatform.repository.VkAccountLinkRepository;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VkIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(VkIntegrationService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZoneId.of("Europe/Moscow"));

    private final VkAccountLinkRepository vkLinkRepository;
    private final UserRepository userRepository;
    private final EventParticipationRepository participationRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.vk.mode:TEST_LOG}")
    private String vkMode;

    @Value("${app.vk.group-id:0}")
    private long vkGroupId;

    @Value("${app.vk.token:}")
    private String vkToken;

    @Value("${app.vk.api-version:5.199}")
    private String vkApiVersion;

    @Value("${app.vk.club-url:https://vk.com/club0}")
    private String vkClubUrl;

    // State for VK Bots Long Poll API
    private String lpServer;
    private String lpKey;
    private String lpTs;

    public VkIntegrationService(
            VkAccountLinkRepository vkLinkRepository,
            UserRepository userRepository,
            EventParticipationRepository participationRepository,
            ObjectMapper objectMapper
    ) {
        this.vkLinkRepository = vkLinkRepository;
        this.userRepository = userRepository;
        this.participationRepository = participationRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isRealVkMode() {
        boolean hasCredentials = vkToken != null && !vkToken.isBlank() && vkGroupId > 0;
        if (!hasCredentials) {
            return false;
        }
        return "REAL".equalsIgnoreCase(vkMode)
                || "LIVE".equalsIgnoreCase(vkMode)
                || "TEST_LOG".equalsIgnoreCase(vkMode);
    }

    private String resolveClubUrl() {
        if ((vkClubUrl == null || vkClubUrl.isBlank() || "https://vk.com/club0".equals(vkClubUrl)) && vkGroupId > 0) {
            return "https://vk.com/club" + vkGroupId;
        }
        return vkClubUrl;
    }

    @Transactional(readOnly = true)
    public VkStatusDto getStatus(UUID userId) {
        String effectiveClubUrl = resolveClubUrl();
        Optional<VkAccountLink> opt = vkLinkRepository.findByUserId(userId);
        if (opt.isEmpty()) {
            return new VkStatusDto(
                    isRealVkMode() ? "REAL" : "TEST_LOG",
                    effectiveClubUrl,
                    vkGroupId,
                    false,
                    null,
                    true,
                    null,
                    null,
                    null
            );
        }
        VkAccountLink link = opt.get();
        String activeCode = (link.getLinkCode() != null && link.getCodeExpiresAt() != null && link.getCodeExpiresAt().isAfter(Instant.now()))
                ? link.getLinkCode() : null;
        return new VkStatusDto(
                isRealVkMode() ? "REAL" : "TEST_LOG",
                effectiveClubUrl,
                vkGroupId,
                link.isLinked(),
                link.getVkUserId(),
                link.isNotificationsEnabled(),
                activeCode,
                link.getCodeExpiresAt(),
                link.getLinkedAt()
        );
    }

    @Transactional
    public VkStatusDto generateLinkCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        VkAccountLink link = vkLinkRepository.findByUserId(userId).orElseGet(() -> {
            VkAccountLink created = new VkAccountLink();
            created.setUser(user);
            return created;
        });

        int num = 100000 + random.nextInt(900000);
        String code = "SP-" + num;
        link.setLinkCode(code);
        link.setCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        vkLinkRepository.save(link);

        return getStatus(userId);
    }

    @Transactional
    public VkStatusDto unlinkVk(UUID userId) {
        vkLinkRepository.findByUserId(userId).ifPresent(link -> {
            link.setLinked(false);
            link.setVkUserId(null);
            link.setLinkCode(null);
            link.setCodeExpiresAt(null);
            vkLinkRepository.save(link);
        });
        return getStatus(userId);
    }

    @Transactional
    public VkStatusDto toggleVkNotifications(UUID userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        user.setNotifyVk(enabled);
        userRepository.save(user);

        vkLinkRepository.findByUserId(userId).ifPresent(link -> {
            link.setNotificationsEnabled(enabled);
            vkLinkRepository.save(link);
        });
        return getStatus(userId);
    }

    /**
     * Обработка входящего сообщения от пользователя к VK-боту (из реального Bots Long Poll API или тестового эмулятора).
     */
    @Transactional
    public String processIncomingBotMessage(Long vkUserId, String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return "Отправьте команду «Помощь» или код привязки вида SP-123456.";
        }
        String text = rawText.trim();
        String upper = text.toUpperCase();

        // 1. Проверка одноразового кода привязки SP-XXXXXX
        if (upper.startsWith("SP-") || upper.startsWith("/START SP-")) {
            String code = upper.replace("/START", "").trim();
            Optional<VkAccountLink> byCode = vkLinkRepository.findByLinkCodeIgnoreCase(code);
            if (byCode.isEmpty()) {
                String reply = "Код привязки «" + code + "» не найден. Сгенерируйте новый код в личном кабинете на сайте платформы.";
                sendMessageToVkUser(vkUserId, reply);
                return reply;
            }
            VkAccountLink link = byCode.get();
            if (link.getCodeExpiresAt() == null || link.getCodeExpiresAt().isBefore(Instant.now())) {
                String reply = "Срок действия кода «" + code + "» истёк (15 минут). Запросите новый код в настройках уведомлений.";
                sendMessageToVkUser(vkUserId, reply);
                return reply;
            }
            // Отвяжем этот vkUserId от другого аккаунта, если он был привязан ранее
            vkLinkRepository.findByVkUserId(vkUserId).ifPresent(other -> {
                if (!other.getId().equals(link.getId())) {
                    other.setLinked(false);
                    other.setVkUserId(null);
                    vkLinkRepository.save(other);
                }
            });

            link.setVkUserId(vkUserId);
            link.setLinked(true);
            link.setNotificationsEnabled(true);
            link.setLinkedAt(Instant.now());
            link.setLinkCode(null);
            link.setCodeExpiresAt(null);
            vkLinkRepository.save(link);

            String reply = "✅ Аккаунт Спортивной Платформы («" + link.getUser().getDisplayName() + "») успешно привязан к VK!\n\n" +
                    "Доступные команды бота:\n" +
                    "• Мои мероприятия — список ваших ближайших записей\n" +
                    "• Статус — проверить привязку и настройки\n" +
                    "• Отключить — приостановить VK-уведомления\n" +
                    "• Включить — возобновить VK-уведомления\n" +
                    "• Помощь — справка по командам";
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        Optional<VkAccountLink> linkedOpt = vkLinkRepository.findByVkUserId(vkUserId);

        if (upper.contains("ПОМОЩЬ") || upper.equals("HELP") || upper.equals("НАЧАТЬ") || upper.equals("/START")) {
            String reply = "👋 Привет! Я бот Спортивной Платформы «Точка Сбора».\n" +
                    (linkedOpt.isPresent() && linkedOpt.get().isLinked()
                            ? "Ваш аккаунт привязан: " + linkedOpt.get().getUser().getDisplayName()
                            : "Чтобы привязать аккаунт, откройте «Настройки уведомлений» на сайте, нажмите «Привязать VK» и пришлите сюда код вида SP-123456.") +
                    "\n\nКоманды: «Мои мероприятия», «Статус», «Отключить», «Включить», «Помощь».";
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        if (linkedOpt.isEmpty() || !linkedOpt.get().isLinked()) {
            String reply = "Ваш VK ещё не привязан к профилю на Спортивной Платформе. Отправьте сюда одноразовый код вида SP-123456 из личного кабинета.";
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        VkAccountLink link = linkedOpt.get();
        User user = link.getUser();

        if (upper.contains("МЕРОПРИЯТ") || upper.equals("EVENTS")) {
            List<EventParticipation> parts = participationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .filter(p -> p.getStatus() == ParticipationStatus.CONFIRMED)
                    .filter(p -> p.getEvent().getStartsAt().isAfter(Instant.now()))
                    .limit(5)
                    .toList();
            if (parts.isEmpty()) {
                String reply = "У вас пока нет предстоящих подтверждённых мероприятий.";
                sendMessageToVkUser(vkUserId, reply);
                return reply;
            }
            StringBuilder sb = new StringBuilder("🏃 Ваши ближайшие мероприятия:\n");
            for (EventParticipation p : parts) {
                Event ev = p.getEvent();
                sb.append("• ").append(ev.getTitle())
                        .append(" (").append(ev.getSport().getName()).append(") — ")
                        .append(DATE_FMT.format(ev.getStartsAt())).append(", ")
                        .append(ev.getCity()).append(", ").append(ev.getLocationAddress()).append("\n");
            }
            String reply = sb.toString().trim();
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        if (upper.contains("ОТКЛЮЧ") || upper.equals("STOP")) {
            link.setNotificationsEnabled(false);
            vkLinkRepository.save(link);
            String reply = "🔕 Уведомления в VK приостановлены. Чтобы снова их получать, напишите «Включить».";
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        if (upper.contains("ВКЛЮЧ") || upper.equals("START")) {
            link.setNotificationsEnabled(true);
            vkLinkRepository.save(link);
            String reply = "🔔 Уведомления и напоминания в VK снова включены!";
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        if (upper.contains("СТАТУС") || upper.equals("STATUS")) {
            String reply = "Профиль: " + user.getDisplayName() + " (" + user.getEmail() + ")\n" +
                    "VK ID: " + vkUserId + "\n" +
                    "Доставка уведомлений: " + (link.isNotificationsEnabled() ? "Включена" : "Отключена");
            sendMessageToVkUser(vkUserId, reply);
            return reply;
        }

        String fallback = "Команда не распознана. Доступные команды: «Мои мероприятия», «Статус», «Отключить», «Включить», «Помощь».";
        sendMessageToVkUser(vkUserId, fallback);
        return fallback;
    }

    public record VkDispatchResult(VkDeliveryStatus status, String detail) {}

    public VkDispatchResult dispatchNotificationToUser(User user, String title, String message) {
        if (!user.isNotifyVk()) {
            return new VkDispatchResult(VkDeliveryStatus.SKIPPED_NOT_LINKED, "Пользователь отключил VK-уведомления в профиле");
        }
        Optional<VkAccountLink> opt = vkLinkRepository.findByUserId(user.getId());
        if (opt.isEmpty() || !opt.get().isLinked() || !opt.get().isNotificationsEnabled() || opt.get().getVkUserId() == null) {
            return new VkDispatchResult(VkDeliveryStatus.SKIPPED_NOT_LINKED, "VK-аккаунт не привязан или уведомления отключены");
        }
        Long vkUserId = opt.get().getVkUserId();
        String fullText = "⚡ " + title + "\n" + message;
        return sendMessageToVkUser(vkUserId, fullText);
    }

    public VkDispatchResult sendMessageToVkUser(Long vkUserId, String text) {
        if (!isRealVkMode()) {
            log.info("[VK BOT TEST_LOG MODE] -> vk_user_id={}: {}", vkUserId, text.replace("\n", " | "));
            return new VkDispatchResult(
                    VkDeliveryStatus.SENT_TEST_LOG,
                    "Доставлено через локальный TEST_LOG провайдер (VK_user_id=" + vkUserId + ")"
            );
        }

        try {
            long randomId = Math.abs(random.nextLong());
            String form = "user_id=" + vkUserId
                    + "&random_id=" + randomId
                    + "&message=" + URLEncoder.encode(text, StandardCharsets.UTF_8)
                    + "&access_token=" + URLEncoder.encode(vkToken, StandardCharsets.UTF_8)
                    + "&v=" + URLEncoder.encode(vkApiVersion, StandardCharsets.UTF_8);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.vk.com/method/messages.send"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(resp.body());
            if (root.has("error")) {
                String errMsg = root.path("error").path("error_msg").asText("VK API Error");
                log.warn("VK messages.send error: {}", errMsg);
                return new VkDispatchResult(VkDeliveryStatus.FAILED, "Ошибка VK API: " + errMsg);
            }
            return new VkDispatchResult(VkDeliveryStatus.SENT_REAL_VK, "Отправлено через VK API (response=" + root.path("response").asText() + ")");
        } catch (Exception e) {
            log.warn("Failed to call VK messages.send", e);
            return new VkDispatchResult(VkDeliveryStatus.FAILED, "Ошибка соединения с VK API: " + e.getMessage());
        }
    }

    /**
     * Фоновый опрос VK Bots Long Poll API (активируется только при VK_BOT_MODE=REAL и наличии токена).
     */
    @Scheduled(fixedDelay = 6000)
    public void pollVkBotsLongPoll() {
        if (!isRealVkMode()) {
            return;
        }
        try {
            if (lpServer == null || lpKey == null || lpTs == null) {
                initLongPollServer();
                if (lpServer == null) return;
            }
            String url = lpServer + "?act=a_check&key=" + URLEncoder.encode(lpKey, StandardCharsets.UTF_8)
                    + "&ts=" + URLEncoder.encode(lpTs, StandardCharsets.UTF_8) + "&wait=5";
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode node = objectMapper.readTree(resp.body());

            if (node.has("failed")) {
                int failed = node.path("failed").asInt();
                if (failed == 1 && node.has("ts")) {
                    lpTs = node.path("ts").asText();
                } else {
                    lpServer = null;
                    lpKey = null;
                    lpTs = null;
                }
                return;
            }

            lpTs = node.path("ts").asText(lpTs);
            JsonNode updates = node.path("updates");
            if (updates.isArray()) {
                for (JsonNode upd : updates) {
                    if ("message_new".equals(upd.path("type").asText())) {
                        JsonNode msgObj = upd.path("object").path("message");
                        if (msgObj.isMissingNode()) {
                            msgObj = upd.path("object");
                        }
                        long fromId = msgObj.path("from_id").asLong(0);
                        String text = msgObj.path("text").asText("");
                        String ref = msgObj.path("ref").asText("");
                        if (fromId > 0) {
                            if (!ref.isBlank() && ref.toUpperCase().startsWith("SP-")) {
                                processIncomingBotMessage(fromId, ref);
                            } else if (!text.isBlank()) {
                                processIncomingBotMessage(fromId, text);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("VK Long Poll check cycle error: {}", e.getMessage());
        }
    }

    private void initLongPollServer() {
        try {
            String url = "https://api.vk.com/method/groups.getLongPollServer?group_id=" + vkGroupId
                    + "&access_token=" + URLEncoder.encode(vkToken, StandardCharsets.UTF_8)
                    + "&v=" + URLEncoder.encode(vkApiVersion, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(resp.body()).path("response");
            if (!root.isMissingNode()) {
                lpServer = root.path("server").asText(null);
                lpKey = root.path("key").asText(null);
                lpTs = root.path("ts").asText(null);
            }
        } catch (Exception e) {
            log.debug("Could not initialize VK Long Poll server: {}", e.getMessage());
        }
    }
}
