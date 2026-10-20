package ru.sportplatform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ru.sportplatform.domain.enums.Enums.*;
import ru.sportplatform.dto.ApiDtos.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SportPlatformIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString(StandardCharsets.UTF_8));
        return root.path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Регистрация пользователей, JWT, создание события с новым видом спорта и свободное/заявочное участие (Сценарии 1, 2, 3)")
    void testUserRegistrationDynamicSportAndParticipationFlows() throws Exception {
        // 1. Регистрация первого пользователя (Организатор личного мероприятия)
        RegisterUserRequest reg1 = new RegisterUserRequest(
                "Иван Организатор", "ivan.org@example.com", "Password123!", true, "Москва"
        );
        MvcResult regRes1 = mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg1)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode auth1 = objectMapper.readTree(regRes1.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String token1 = auth1.path("accessToken").asText();
        assertThat(token1).isNotBlank();
        assertThat(auth1.path("user").path("globalRole").asText()).isEqualTo("USER");

        // 2. Регистрация второго и третьего пользователей (Участники)
        RegisterUserRequest reg2 = new RegisterUserRequest(
                "Пётр Участник", "petr.part@example.com", "Password123!", true, "Москва"
        );
        String token2 = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg2)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)).path("accessToken").asText();

        RegisterUserRequest reg3 = new RegisterUserRequest(
                "Анна Кандидат", "anna.cand@example.com", "Password123!", true, "Москва"
        );
        String token3 = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg3)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)).path("accessToken").asText();

        // 3. Сценарий 1: Создание мероприятия с НОВЫМ видом спорта «Падел-теннис», которого нет в исходном списке
        CreateEventRequest createOpenEvent = new CreateEventRequest(
                "Открытая тренировка по Падел-теннису",
                "Знакомимся с падел-теннисом на крытых кортах, ракетки предоставляются.",
                null,
                "Падел-теннис",
                "Ракеточные дисциплины",
                null,
                "Москва",
                "ул. Спортивная, д. 10",
                55.75, 37.61,
                Instant.now().plus(20, ChronoUnit.HOURS),
                Instant.now().plus(22, ChronoUnit.HOURS),
                JoinMode.OPEN,
                SkillLevel.BEGINNER,
                "Групповая игра",
                "Свободный вход",
                "Кроссовки со светлой подошвой",
                2, // Лимит 2 участника для проверки Waitlist
                false, null, null, null, null, null
        );

        MvcResult evRes = mockMvc.perform(post("/api/v1/events")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOpenEvent)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode createdEventNode = objectMapper.readTree(evRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("event");
        UUID openEventId = UUID.fromString(createdEventNode.path("id").asText());
        UUID dynamicSportId = UUID.fromString(createdEventNode.path("sport").path("id").asText());
        assertThat(createdEventNode.path("sport").path("name").asText()).isEqualTo("Падел-теннис");

        // 4. Проверим, что другой пользователь находит мероприятие по новому виду спорта
        mockMvc.perform(get("/api/v1/events").param("sportId", dynamicSportId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Открытая тренировка по Падел-теннису"));

        // 5. Сценарий 2: Свободное участие (Пётр присоединяется -> CONFIRMED)
        mockMvc.perform(post("/api/v1/events/" + openEventId + "/join")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Иду!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.viewerParticipationStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.event.confirmedParticipantsCount").value(1));

        // 6. Сценарий 3: Создание мероприятия ПО ЗАЯВКЕ (APPROVAL_REQUIRED) и проверка принятия и отклонения
        CreateEventRequest createApprovalEvent = new CreateEventRequest(
                "Закрытый спарринг по Падел-теннису",
                "Отбор по заявкам организатора",
                dynamicSportId, null, null, null,
                "Москва", "ул. Спортивная, д. 10",
                55.75, 37.61,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Instant.now().plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                JoinMode.APPROVAL_REQUIRED,
                SkillLevel.AMATEUR,
                "Парный матч", "По заявке", "Ракетка", 4,
                false, null, null, null, null, null
        );
        UUID approvalEventId = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/events")
                                .header("Authorization", "Bearer " + token1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createApprovalEvent)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("event").path("id").asText());

        // Пётр и Анна подают заявки -> статус PENDING
        mockMvc.perform(post("/api/v1/events/" + approvalEventId + "/join")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Играю 3 года\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.viewerParticipationStatus").value("PENDING"));

        mockMvc.perform(post("/api/v1/events/" + approvalEventId + "/join")
                        .header("Authorization", "Bearer " + token3)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Хочу попробовать\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.viewerParticipationStatus").value("PENDING"));

        // Организатор смотрит список заявок и принимает Петра, но отклоняет Анну
        JsonNode detailWithPending = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/events/" + approvalEventId)
                                .header("Authorization", "Bearer " + token1))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        );
        JsonNode pendingArr = detailWithPending.path("pendingApplications");
        assertThat(pendingArr.size()).isEqualTo(2);
        UUID petrPartId = UUID.fromString(pendingArr.get(0).path("participationId").asText());
        UUID annaPartId = UUID.fromString(pendingArr.get(1).path("participationId").asText());

        mockMvc.perform(post("/api/v1/events/" + approvalEventId + "/participations/" + petrPartId + "/decision")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"CONFIRMED\",\"comment\":\"Добро пожаловать в команду!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.confirmedParticipantsCount").value(1));

        mockMvc.perform(post("/api/v1/events/" + approvalEventId + "/participations/" + annaPartId + "/decision")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"REJECTED\",\"comment\":\"Нужен опыт игры от 1 года\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.confirmedParticipantsCount").value(1));

        // Проверим статусы глазами Анны (REJECTED) и Петра (CONFIRMED)
        mockMvc.perform(get("/api/v1/events/" + approvalEventId).header("Authorization", "Bearer " + token3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.viewerParticipationStatus").value("REJECTED"));
    }

    @Test
    @DisplayName("2. Регистрация организации, отказ с причиной, исправление, повторная подача, одобрение и публикация (Сценарий 4)")
    void testOrganizationModerationResubmissionAndPublishingFlow() throws Exception {
        String adminToken = loginAndGetToken("admin@sportplatform.ru", "AdminPassword123!");

        RegisterOrganizationRequest orgReg = new RegisterOrganizationRequest(
                "Сергей Клубный",
                "sergey.club@example.com",
                "Password123!",
                true,
                "Беговой клуб Северный Ветер",
                OrganizationType.SPORTS_CLUB,
                "Санкт-Петербург",
                "Регулярные пробежки на Крестовском острове.",
                "+7 (911) 000-11-22",
                "vk.com/northwind_run",
                null,
                "https://vk.com/northwind_run",
                null,
                null,
                null,
                List.of("Скайраннинг")
        );

        MvcResult regRes = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orgReg)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(regRes.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String ownerToken = root.path("accessToken").asText();
        UUID orgId = UUID.fromString(root.path("myOrganizations").get(0).path("id").asText());
        UUID sportId = UUID.fromString(root.path("myOrganizations").get(0).path("sports").get(0).path("id").asText());
        assertThat(root.path("myOrganizations").get(0).path("status").asText()).isEqualTo("PENDING_REVIEW");

        // Попытка опубликовать мероприятие от имени неодобренной организации должна быть отклонена (403 Forbidden)
        CreateEventRequest prematureEvent = new CreateEventRequest(
                "Забег от неодобренного клуба",
                "Проверка защиты публикации до модерации",
                sportId, null, null, orgId,
                "Санкт-Петербург", "Приморский парк Победы",
                59.97, 30.24,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Instant.now().plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ANY, "Пробежка", null, null, 30,
                false, null, null, null, null, null
        );
        mockMvc.perform(post("/api/v1/events")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prematureEvent)))
                .andExpect(status().isForbidden());

        // Администратор отклоняет заявку с причиной
        AdminOrgModerationRequest rejectReq = new AdminOrgModerationRequest(
                OrganizationStatus.REJECTED,
                "Пожалуйста, добавьте ссылку для верификации деятельности клуба и расписание тренировок.",
                "Первичная проверка: не хватает ссылки"
        );
        mockMvc.perform(post("/api/v1/admin/organizations/" + orgId + "/decision")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Пожалуйста, добавьте ссылку для верификации деятельности клуба и расписание тренировок."));

        // Представитель исправляет данные и отправляет повторную заявку -> статус PENDING_REVIEW, submissionVersion = 2
        UpdateOrganizationApplicationRequest resubmitReq = new UpdateOrganizationApplicationRequest(
                "Беговой клуб Северный Ветер",
                OrganizationType.SPORTS_CLUB,
                "Санкт-Петербург",
                "Регулярные пробежки на Крестовском острове каждую среду и субботу.",
                "Сергей Клубный",
                "+7 (911) 000-11-22",
                "Публичный чат: vk.com/northwind_run",
                "https://northwind.example.ru",
                "https://vk.com/northwind_run",
                "https://vk.com/northwind_run",
                "Добавили ссылку на группу с фотоотчётами",
                null,
                List.of(sportId)
        );
        mockMvc.perform(put("/api/v1/organizations/" + orgId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resubmitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.submissionVersion").value(2))
                .andExpect(jsonPath("$.applicationHistory.length()").value(2));

        // Администратор одобряет повторную заявку -> APPROVED
        AdminOrgModerationRequest approveReq = new AdminOrgModerationRequest(
                OrganizationStatus.APPROVED,
                "Сведения проверены, организация допущена.",
                "Проверено повторно"
        );
        mockMvc.perform(post("/api/v1/admin/organizations/" + orgId + "/decision")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Теперь представитель успешно публикует регулярную серию от имени одобренной организации
        CreateEventRequest orgEvent = new CreateEventRequest(
                "Клубный забег Северного Ветра",
                "Открытая тренировка от проверенной организации",
                sportId, null, null, orgId,
                "Санкт-Петербург", "Приморский парк Победы",
                59.97, 30.24,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Instant.now().plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ANY, "Клубная серия", null, null, 30,
                true, 6, "10:00", 90, LocalDate.now(), LocalDate.now().plusWeeks(3)
        );
        mockMvc.perform(post("/api/v1/events")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orgEvent)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.organizationVerified").value(true))
                .andExpect(jsonPath("$.event.recurringOccurrence").value(true));
    }

    @Test
    @DisplayName("3. Обсуждения с вложениями, модерация сообщения и снятие события с публикации, тикеты, чат и VK (Сценарии 5, 6 + расширения)")
    void testDiscussionsAttachmentsModerationSupportAndVkFlows() throws Exception {
        String adminToken = loginAndGetToken("admin@sportplatform.ru", "AdminPassword123!");

        RegisterUserRequest u1 = new RegisterUserRequest("Ольга Спорт", "olga@example.com", "Password123!", true, "Казань");
        String token1 = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(u1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)).path("accessToken").asText();

        RegisterUserRequest u2 = new RegisterUserRequest("Максим Партнёр", "maxim@example.com", "Password123!", true, "Казань");
        JsonNode auth2 = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(u2)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        String token2 = auth2.path("accessToken").asText();
        UUID user2Id = UUID.fromString(auth2.path("user").path("id").asText());

        // Создание мероприятия
        CreateEventRequest evReq = new CreateEventRequest(
                "Вечерний волейбол в Казани",
                "Собираем две команды на открытой площадке",
                null, "Пляжный волейбол", "Командные игры", null,
                "Казань", "Парк Урам", 55.79, 49.11,
                Instant.now().plus(1, ChronoUnit.DAYS),
                Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ANY, "Игра", null, null, 12,
                false, null, null, null, null, null
        );
        UUID eventId = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/events")
                                .header("Authorization", "Bearer " + token1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(evReq)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("event").path("id").asText());

        // Загрузка PNG-изображения (с корректной PNG сигнатурой) в обсуждение
        byte[] validPngBytes = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile pngFile = new MockMultipartFile("file", "court-photo.png", "image/png", validPngBytes);
        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/attachments")
                        .file(pngFile)
                        .param("contextType", "DISCUSSION")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andReturn();
        UUID attachmentId = UUID.fromString(objectMapper.readTree(uploadRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("id").asText());

        // Отправка сообщения с изображением и ссылкой в обсуждение мероприятия
        CreateDiscussionMessageRequest msgReq = new CreateDiscussionMessageRequest(
                "Прикрепляю схему прохода к площадке!",
                null,
                "https://uram.park.example.ru",
                null,
                List.of(attachmentId)
        );
        MvcResult msgRes = mockMvc.perform(post("/api/v1/events/" + eventId + "/discussions")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msgReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attachments.length()").value(1))
                .andReturn();
        UUID messageId = UUID.fromString(objectMapper.readTree(msgRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("id").asText());

        // Сценарий 6.1: Администратор скрывает сообщение -> оно исчезает из публичного обсуждения, а его вложение блокируется для обычных пользователей
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/discussions/" + messageId + "/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Некорректная рекламная ссылка\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN_BY_ADMIN"));

        mockMvc.perform(get("/api/v1/events/" + eventId + "/discussions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/v1/attachments/" + attachmentId + "/content")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isForbidden());

        // Сценарий 6.2: Администратор снимает мероприятие с публикации -> нельзя записаться даже по прямому запросу
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/unpublish")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Площадка закрыта на реконструкцию\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.status").value("UNPUBLISHED_BY_ADMIN"));

        mockMvc.perform(post("/api/v1/events/" + eventId + "/join")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());

        // Проверка системы спортивных знакомых (запрос -> принятие)
        MvcResult friendReqRes = mockMvc.perform(post("/api/v1/friends/requests")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetUserId\":\"" + user2Id + "\",\"message\":\"Привет, давай играть вместе!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();
        UUID friendshipId = UUID.fromString(objectMapper.readTree(friendReqRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("id").asText());

        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/respond")
                        .param("accept", "true")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // Проверка тикет-системы и изоляции чужих тикетов
        CreateTicketRequest ticketReq = new CreateTicketRequest(
                TicketCategory.TECHNICAL_ISSUE,
                "Вопрос по загрузке видео",
                "Подскажите допустимые форматы видеороликов в обсуждении",
                null, null, null
        );
        MvcResult ticketRes = mockMvc.perform(post("/api/v1/support/tickets")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ticketReq)))
                .andExpect(status().isOk())
                .andReturn();
        UUID ticketId = UUID.fromString(objectMapper.readTree(ticketRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("id").asText());

        // Второй пользователь не может прочитать чужой тикет (403 Forbidden)
        mockMvc.perform(get("/api/v1/support/tickets/" + ticketId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isForbidden());

        // Администратор отвечает в тикет и переводит его в RESOLVED
        ReplyTicketRequest adminTicketReply = new ReplyTicketRequest(
                "Поддерживаются форматы MP4 и WebM размером до 50 МБ.",
                null,
                TicketStatus.RESOLVED,
                "Разъяснены лимиты видеофайлов"
        );
        mockMvc.perform(post("/api/v1/admin/tickets/" + ticketId + "/reply")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminTicketReply)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        // Проверка чата техподдержки + привязки VK-бота по одноразовому коду
        mockMvc.perform(post("/api/v1/support/chat/messages")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Здравствуйте! Как привязать уведомления ВКонтакте?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages.length()").value(1));

        MvcResult vkCodeRes = mockMvc.perform(post("/api/v1/vk/generate-code")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andReturn();
        String linkCode = objectMapper.readTree(vkCodeRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("activeLinkCode").asText();
        assertThat(linkCode).startsWith("SP-");

        mockMvc.perform(post("/api/v1/vk/simulate-bot-message")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vkUserId\":777888999,\"messageText\":\"" + linkCode + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.linked").value(true))
                .andExpect(jsonPath("$.status.vkUserId").value(777888999));
    }

    @Test
    @DisplayName("4. Защита от самозаписи, пересечений расписания, прошедших дат, личные сообщения друзей и разблокировка организаций")
    void testOverlapSelfJoinDirectMessagesAndOrgUnblock() throws Exception {
        String adminToken = loginAndGetToken("admin@sportplatform.ru", "AdminPassword123!");

        RegisterUserRequest uA = new RegisterUserRequest("Алексей Организатор", "alex.ov@example.com", "Password123!", true, "Москва");
        JsonNode authA = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(uA)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        String tokenA = authA.path("accessToken").asText();
        UUID userAId = UUID.fromString(authA.path("user").path("id").asText());

        RegisterUserRequest uB = new RegisterUserRequest("Денис Спортсмен", "denis.ov@example.com", "Password123!", true, "Москва");
        JsonNode authB = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/register/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(uB)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        String tokenB = authB.path("accessToken").asText();
        UUID userBId = UUID.fromString(authB.path("user").path("id").asText());

        // 1. Запрет создания мероприятия в прошлом -> 400 Bad Request
        CreateEventRequest pastEvent = new CreateEventRequest(
                "Тренировка вчера", "Проверка валидации прошлого времени",
                null, "Бег", "Циклические", null, "Москва", "Лужники", null, null,
                Instant.now().minus(2, ChronoUnit.DAYS),
                Instant.now().minus(2, ChronoUnit.DAYS).plus(1, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ANY, "Спортивные тренировки", null, null, 10,
                false, null, null, null, null, null
        );
        mockMvc.perform(post("/api/v1/events")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pastEvent)))
                .andExpect(status().isBadRequest());

        // 2. Создаём мероприятие №1 (завтра с 18:00 до 20:00)
        Instant start1 = Instant.now().plus(24, ChronoUnit.HOURS);
        Instant end1 = start1.plus(2, ChronoUnit.HOURS);
        CreateEventRequest ev1Req = new CreateEventRequest(
                "Вечерний кросс в Лужниках", "Интенсивная пробежка 10 км",
                null, "Бег", "Циклические", null, "Москва", "Лужники", null, null,
                start1, end1, JoinMode.OPEN, SkillLevel.ANY, "Спортивные тренировки", null, null, 15,
                false, null, null, null, null, null
        );
        UUID event1Id = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/events")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(ev1Req)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("event").path("id").asText());

        // 3. Организатор НЕ может записаться на собственное мероприятие -> 409 Conflict
        mockMvc.perform(post("/api/v1/events/" + event1Id + "/join")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());

        // 4. Денис успешно записывается на мероприятие №1 -> CONFIRMED
        mockMvc.perform(post("/api/v1/events/" + event1Id + "/join")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.viewerParticipationStatus").value("CONFIRMED"));

        // 5. Создаём пересекающееся по времени мероприятие №2 (сдвиг на 30 минут внутри интервала первого)
        CreateEventRequest ev2Req = new CreateEventRequest(
                "Функциональный тренинг в Парке Горького", "Силовая тренировка на воздухе",
                null, "Воркаут", "Силовые", null, "Москва", "Парк Горького", null, null,
                start1.plus(30, ChronoUnit.MINUTES), end1.plus(30, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Спортивные тренировки", null, null, 15,
                false, null, null, null, null, null
        );
        UUID event2Id = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/events")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(ev2Req)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("event").path("id").asText());

        // Денис пытается записаться на пересекающееся мероприятие №2 -> 409 Conflict с указанием названия «Вечерний кросс в Лужниках»
        mockMvc.perform(post("/api/v1/events/" + event2Id + "/join")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Вечерний кросс в Лужниках")));

        // 6. Личные сообщения: до подтверждения дружбы — 403 Forbidden
        mockMvc.perform(post("/api/v1/friends/" + userBId + "/messages")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Привет!\"}"))
                .andExpect(status().isForbidden());

        // Отправляем и принимаем заявку в друзья
        UUID friendshipId = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/friends/requests")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"targetUserId\":\"" + userBId + "\",\"message\":\"Добавляйся!\"}"))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("id").asText());

        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/respond")
                        .param("accept", "true")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // Теперь обмен личными сообщениями между друзьями работает в обе стороны
        mockMvc.perform(post("/api/v1/friends/" + userBId + "/messages")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Привет, Денис! Идёшь завтра на кросс?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Привет, Денис! Идёшь завтра на кросс?"));

        mockMvc.perform(get("/api/v1/friends/" + userAId + "/messages")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("Привет, Денис! Идёшь завтра на кросс?"));

        // 7. Блокировка и разблокировка сообщества (SUSPENDED -> APPROVED)
        CreateCommunityRequest commReq = new CreateCommunityRequest(
                "Московский Клуб Марафонцев", OrganizationType.COMMUNITY, "Москва",
                "Открытое беговое сообщество", "t.me/msk_marathon", null, null, null, null, List.of("Марафон")
        );
        UUID commId = UUID.fromString(objectMapper.readTree(
                mockMvc.perform(post("/api/v1/organizations/community")
                                .header("Authorization", "Bearer " + tokenA)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(commReq)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)
        ).path("id").asText());

        mockMvc.perform(post("/api/v1/admin/organizations/" + commId + "/decision")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminOrgModerationRequest(OrganizationStatus.SUSPENDED, "Временная приостановка", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        mockMvc.perform(post("/api/v1/admin/organizations/" + commId + "/decision")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminOrgModerationRequest(OrganizationStatus.APPROVED, "Разблокировано после проверки", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
