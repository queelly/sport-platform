package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.Attachment;
import ru.sportplatform.domain.entity.DiscussionMessage;
import ru.sportplatform.domain.entity.Event;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.enums.Enums.EventStatus;
import ru.sportplatform.domain.enums.Enums.GlobalRole;
import ru.sportplatform.domain.enums.Enums.MessageVisibilityStatus;
import ru.sportplatform.dto.ApiDtos.AttachmentDto;
import ru.sportplatform.dto.ApiDtos.CreateDiscussionMessageRequest;
import ru.sportplatform.dto.ApiDtos.DiscussionMessageDto;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.AttachmentRepository;
import ru.sportplatform.repository.DiscussionMessageRepository;
import ru.sportplatform.repository.EventRepository;
import ru.sportplatform.repository.UserRepository;
import ru.sportplatform.security.UserPrincipal;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DiscussionService {

    private final DiscussionMessageRepository messageRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public DiscussionService(
            DiscussionMessageRepository messageRepository,
            EventRepository eventRepository,
            UserRepository userRepository,
            AttachmentRepository attachmentRepository,
            FileStorageService fileStorageService,
            AuditLogService auditLogService
    ) {
        this.messageRepository = messageRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<DiscussionMessageDto> listMessages(UUID eventId, UserPrincipal viewer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        boolean isAdmin = viewer != null && viewer.isAdmin();

        return messageRepository.findByEventIdOrderByCreatedAtAsc(eventId)
                .stream()
                .filter(m -> isAdmin || m.getStatus() == MessageVisibilityStatus.VISIBLE)
                .map(m -> toDto(m, event))
                .toList();
    }

    @Transactional
    public DiscussionMessageDto postMessage(UUID eventId, UserPrincipal viewer, CreateDiscussionMessageRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        if (event.getStatus() == EventStatus.UNPUBLISHED_BY_ADMIN && !viewer.isAdmin()) {
            throw ApiException.forbidden("Нельзя отправлять сообщения в обсуждение мероприятия, снятого с публикации");
        }

        User author = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        String validVideoUrl = validateSafeHttpUrl(req.externalVideoUrl(), "видеоссылки");
        String validLinkUrl = validateSafeHttpUrl(req.externalLinkUrl(), "внешней ссылки");

        DiscussionMessage msg = new DiscussionMessage();
        msg.setEvent(event);
        msg.setAuthor(author);
        msg.setContent(req.content().trim());
        msg.setExternalVideoUrl(validVideoUrl);
        msg.setExternalLinkUrl(validLinkUrl);
        msg.setReplyToMessageId(req.replyToMessageId());
        msg.setStatus(MessageVisibilityStatus.VISIBLE);

        List<Attachment> attachments = new ArrayList<>();
        if (req.attachmentIds() != null && !req.attachmentIds().isEmpty()) {
            for (UUID attId : req.attachmentIds()) {
                Attachment att = attachmentRepository.findById(attId)
                        .orElseThrow(() -> ApiException.notFound("Вложение не найдено: " + attId));
                if (!att.getUploader().getId().equals(author.getId()) && !viewer.isAdmin()) {
                    throw ApiException.forbidden("Нельзя прикрепить чужой загруженный файл");
                }
                att.setContextType("DISCUSSION");
                attachments.add(att);
            }
        }
        msg.setAttachments(attachments);
        msg = messageRepository.save(msg);

        for (Attachment att : attachments) {
            att.setContextId(msg.getId());
            attachmentRepository.save(att);
        }

        return toDto(msg, event);
    }

    @Transactional
    public DiscussionMessageDto hideMessageByAdmin(UUID eventId, UUID messageId, UserPrincipal adminViewer, String reason) {
        User admin = userRepository.findById(adminViewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        DiscussionMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Сообщение не найдено"));

        if (!msg.getEvent().getId().equals(eventId)) {
            throw ApiException.badRequest("Сообщение не относится к данному мероприятию");
        }

        String prevState = msg.getStatus().name();
        msg.setStatus(MessageVisibilityStatus.HIDDEN_BY_ADMIN);
        msg.setModerationReason(reason);
        msg.setModeratedByAdminId(admin.getId());

        for (Attachment att : msg.getAttachments()) {
            att.setHidden(true);
            attachmentRepository.save(att);
        }

        msg = messageRepository.save(msg);

        auditLogService.record(
                admin,
                "HIDE_DISCUSSION_MESSAGE",
                "DISCUSSION_MESSAGE",
                msg.getId(),
                prevState,
                MessageVisibilityStatus.HIDDEN_BY_ADMIN.name(),
                reason
        );

        return toDto(msg, event);
    }

    private String validateSafeHttpUrl(String rawUrl, String fieldLabel) {
        if (rawUrl == null || rawUrl.isBlank()) return null;
        String trimmed = rawUrl.trim();
        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw ApiException.badRequest("Для " + fieldLabel + " разрешены только безопасные ссылки http:// или https://");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw ApiException.badRequest("Некорректный адрес " + fieldLabel);
            }
            return trimmed;
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Некорректный формат URL для " + fieldLabel);
        }
    }

    private DiscussionMessageDto toDto(DiscussionMessage m, Event event) {
        boolean isOrganizer = event.getOrganizer().getId().equals(m.getAuthor().getId())
                || (event.getOrganization() != null && event.getOrganization().getOwner().getId().equals(m.getAuthor().getId()));
        boolean isAdmin = m.getAuthor().getGlobalRole() == GlobalRole.ADMIN;

        String avatarUrl = m.getAuthor().getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + m.getAuthor().getAvatarAttachmentId() + "/content"
                : null;

        List<AttachmentDto> attDtos = m.getStatus() == MessageVisibilityStatus.VISIBLE
                ? m.getAttachments().stream().map(fileStorageService::toDto).toList()
                : List.of();

        return new DiscussionMessageDto(
                m.getId(),
                event.getId(),
                m.getAuthor().getId(),
                m.getAuthor().getDisplayName(),
                avatarUrl,
                isOrganizer,
                isAdmin,
                m.getContent(),
                m.getExternalVideoUrl(),
                m.getExternalLinkUrl(),
                m.getReplyToMessageId(),
                m.getStatus(),
                m.getModerationReason(),
                attDtos,
                m.getCreatedAt()
        );
    }
}
