package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.*;
import ru.sportplatform.domain.enums.Enums.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.*;
import ru.sportplatform.security.UserPrincipal;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
public class SupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportTicketMessageRepository ticketMessageRepository;
    private final SupportConversationRepository conversationRepository;
    private final SupportChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final SecureRandom random = new SecureRandom();

    public SupportService(
            SupportTicketRepository ticketRepository,
            SupportTicketMessageRepository ticketMessageRepository,
            SupportConversationRepository conversationRepository,
            SupportChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            AttachmentRepository attachmentRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    // =========================================================================
    // 1. СИСТЕМА ТИКЕТОВ ДЛЯ ЖАЛОБ И ОБРАЩЕНИЙ
    // =========================================================================

    @Transactional
    public SupportTicketDto createTicket(UserPrincipal viewer, CreateTicketRequest req) {
        User author = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber("TCK-" + (10000 + random.nextInt(90000)));
        ticket.setAuthor(author);
        ticket.setCategory(req.category());
        ticket.setSubject(req.subject().trim());
        ticket.setDescription(req.description().trim());
        ticket.setTargetType(req.targetType());
        ticket.setTargetId(req.targetId());
        ticket.setStatus(TicketStatus.OPEN);
        ticket = ticketRepository.save(ticket);

        SupportTicketMessage initialMsg = new SupportTicketMessage();
        initialMsg.setTicket(ticket);
        initialMsg.setAuthor(author);
        initialMsg.setAdminReply(false);
        initialMsg.setContent(req.description().trim());
        if (req.attachmentId() != null) {
            Attachment att = attachmentRepository.findById(req.attachmentId())
                    .orElseThrow(() -> ApiException.notFound("Прикреплённый файл не найден"));
            att.setContextType("TICKET");
            att.setContextId(ticket.getId());
            attachmentRepository.save(att);
            initialMsg.setAttachment(att);
        }
        ticketMessageRepository.save(initialMsg);

        return toTicketDto(ticket);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDto> listMyTickets(UserPrincipal viewer) {
        return ticketRepository.findByAuthorIdOrderByUpdatedAtDesc(viewer.id())
                .stream()
                .map(this::toTicketDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDto> listAllTicketsForAdmin(TicketStatus statusFilter) {
        return ticketRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .filter(t -> statusFilter == null || t.getStatus() == statusFilter)
                .map(this::toTicketDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupportTicketDto getTicket(UUID ticketId, UserPrincipal viewer) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Обращение не найдено"));

        if (!viewer.isAdmin() && !ticket.getAuthor().getId().equals(viewer.id())) {
            throw ApiException.forbidden("Вы не можете просматривать чужие обращения");
        }
        return toTicketDto(ticket);
    }

    @Transactional
    public SupportTicketDto replyOrUpdateTicket(UUID ticketId, UserPrincipal viewer, ReplyTicketRequest req) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Обращение не найдено"));

        boolean isAdmin = viewer.isAdmin();
        if (!isAdmin && !ticket.getAuthor().getId().equals(viewer.id())) {
            throw ApiException.forbidden("Вы не можете отвечать в чужом обращении");
        }

        User sender = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        SupportTicketMessage msg = new SupportTicketMessage();
        msg.setTicket(ticket);
        msg.setAuthor(sender);
        msg.setAdminReply(isAdmin);
        msg.setContent(req.content().trim());

        if (req.attachmentId() != null) {
            Attachment att = attachmentRepository.findById(req.attachmentId())
                    .orElseThrow(() -> ApiException.notFound("Файл вложения не найден"));
            att.setContextType("TICKET");
            att.setContextId(ticket.getId());
            attachmentRepository.save(att);
            msg.setAttachment(att);
        }
        ticketMessageRepository.save(msg);

        String prevStatus = ticket.getStatus().name();
        if (isAdmin) {
            ticket.setAssignedAdminId(sender.getId());
            if (req.newStatus() != null) {
                ticket.setStatus(req.newStatus());
            } else if (ticket.getStatus() == TicketStatus.OPEN) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            }
            if (req.resolutionSummary() != null && !req.resolutionSummary().isBlank()) {
                ticket.setResolutionSummary(req.resolutionSummary().trim());
            }
            ticket = ticketRepository.save(ticket);

            auditLogService.record(
                    sender,
                    "REPLY_SUPPORT_TICKET",
                    "TICKET",
                    ticket.getId(),
                    prevStatus,
                    ticket.getStatus().name(),
                    req.content()
            );

            notificationService.notifyUser(
                    ticket.getAuthor(),
                    NotificationType.TICKET_REPLY,
                    "Ответ администратора по обращению " + ticket.getTicketNumber(),
                    "По вашему обращению «" + ticket.getSubject() + "» получен ответ. Текущий статус: " + ticket.getStatus(),
                    "/support/tickets/" + ticket.getId()
            );
        } else {
            // Если пользователь ответил в тикет, который ждал его ответа или был решён — возвращаем в IN_PROGRESS/OPEN
            if (ticket.getStatus() == TicketStatus.WAITING_FOR_USER || ticket.getStatus() == TicketStatus.RESOLVED) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            }
            ticket = ticketRepository.save(ticket);
        }

        return toTicketDto(ticket);
    }

    // =========================================================================
    // 2. ОТДЕЛЬНЫЙ ЧАТ ТЕХНИЧЕСКОЙ ПОДДЕРЖКИ
    // =========================================================================

    @Transactional
    public SupportConversationDto getMySupportChat(UserPrincipal viewer) {
        User user = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        SupportConversation conv = conversationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    SupportConversation created = new SupportConversation();
                    created.setUser(user);
                    created.setStatus(SupportConversationStatus.ACTIVE);
                    created.setUnreadByUser(false);
                    created.setUnreadByAdmin(false);
                    return conversationRepository.save(created);
                });

        if (conv.isUnreadByUser()) {
            conv.setUnreadByUser(false);
            conv = conversationRepository.save(conv);
        }
        return toConversationDto(conv);
    }

    @Transactional
    public SupportConversationDto sendUserChatMessage(UserPrincipal viewer, SendSupportChatMessageRequest req) {
        User user = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        SupportConversation conv = conversationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    SupportConversation created = new SupportConversation();
                    created.setUser(user);
                    return conversationRepository.save(created);
                });

        SupportChatMessage msg = new SupportChatMessage();
        msg.setConversation(conv);
        msg.setSender(user);
        msg.setFromAdmin(false);
        msg.setContent(req.content().trim());
        chatMessageRepository.save(msg);

        conv.setStatus(SupportConversationStatus.ACTIVE);
        conv.setUnreadByAdmin(true);
        conv.setUnreadByUser(false);
        conv.setLastMessagePreview(truncate(req.content().trim(), 120));
        conv = conversationRepository.save(conv);

        return toConversationDto(conv);
    }

    @Transactional(readOnly = true)
    public List<SupportConversationDto> listAllConversationsForAdmin() {
        return conversationRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toConversationDto)
                .toList();
    }

    @Transactional
    public SupportConversationDto sendAdminChatReply(UUID conversationId, UserPrincipal adminViewer, SendSupportChatMessageRequest req, SupportConversationStatus statusOverride) {
        User admin = userRepository.findById(adminViewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        SupportConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Диалог поддержки не найден"));

        SupportChatMessage msg = new SupportChatMessage();
        msg.setConversation(conv);
        msg.setSender(admin);
        msg.setFromAdmin(true);
        msg.setContent(req.content().trim());
        chatMessageRepository.save(msg);

        conv.setStatus(statusOverride != null ? statusOverride : SupportConversationStatus.ANSWERED);
        conv.setUnreadByAdmin(false);
        conv.setUnreadByUser(true);
        conv.setLastMessagePreview("Поддержка: " + truncate(req.content().trim(), 100));
        conv = conversationRepository.save(conv);

        notificationService.notifyUser(
                conv.getUser(),
                NotificationType.SUPPORT_CHAT_REPLY,
                "Новое сообщение в чате техподдержки",
                "Администратор ответил на ваш вопрос: «" + truncate(req.content().trim(), 90) + "»",
                "/support/chat"
        );

        return toConversationDto(conv);
    }

    private SupportTicketDto toTicketDto(SupportTicket t) {
        List<TicketMessageDto> msgs = ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(t.getId())
                .stream()
                .map(m -> new TicketMessageDto(
                        m.getId(),
                        m.getAuthor().getId(),
                        m.getAuthor().getDisplayName(),
                        m.isAdminReply(),
                        m.getContent(),
                        m.getAttachment() != null ? fileStorageService.toDto(m.getAttachment()) : null,
                        m.getCreatedAt()
                ))
                .toList();

        return new SupportTicketDto(
                t.getId(),
                t.getTicketNumber(),
                t.getAuthor().getId(),
                t.getAuthor().getDisplayName(),
                t.getAuthor().getEmail(),
                t.getCategory(),
                t.getSubject(),
                t.getDescription(),
                t.getTargetType(),
                t.getTargetId(),
                t.getStatus(),
                t.getResolutionSummary(),
                msgs,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }

    private SupportConversationDto toConversationDto(SupportConversation c) {
        List<SupportChatMessageDto> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId())
                .stream()
                .map(m -> new SupportChatMessageDto(
                        m.getId(),
                        m.getSender().getId(),
                        m.getSender().getDisplayName(),
                        m.isFromAdmin(),
                        m.getContent(),
                        m.getCreatedAt()
                ))
                .toList();

        return new SupportConversationDto(
                c.getId(),
                c.getUser().getId(),
                c.getUser().getDisplayName(),
                c.getUser().getEmail(),
                c.getStatus(),
                c.isUnreadByUser(),
                c.isUnreadByAdmin(),
                c.getLastMessagePreview(),
                msgs,
                c.getUpdatedAt()
        );
    }

    private String truncate(String s, int max) {
        if (s.length() <= max) return s;
        return s.substring(0, max - 1) + "…";
    }
}
