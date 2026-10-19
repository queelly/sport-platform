package ru.sportplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.sportplatform.domain.entity.Attachment;
import ru.sportplatform.domain.entity.DiscussionMessage;
import ru.sportplatform.domain.entity.Event;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.enums.Enums.AttachmentType;
import ru.sportplatform.domain.enums.Enums.EventStatus;
import ru.sportplatform.domain.enums.Enums.MessageVisibilityStatus;
import ru.sportplatform.dto.ApiDtos.AttachmentDto;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.AttachmentRepository;
import ru.sportplatform.repository.DiscussionMessageRepository;
import ru.sportplatform.repository.EventRepository;
import ru.sportplatform.repository.SupportTicketMessageRepository;
import ru.sportplatform.repository.UserRepository;
import ru.sportplatform.security.UserPrincipal;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final Set<String> ALLOWED_VIDEO_EXT = Set.of("mp4", "webm", "mov");
    private static final Set<String> ALLOWED_DOC_EXT = Set.of("pdf", "txt", "doc", "docx", "xls", "xlsx", "ics");

    private final Path uploadDir;
    private final long maxImageBytes;
    private final long maxDocumentBytes;
    private final long maxVideoBytes;

    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final DiscussionMessageRepository discussionMessageRepository;
    private final EventRepository eventRepository;
    private final SupportTicketMessageRepository ticketMessageRepository;

    public FileStorageService(
            @Value("${app.storage.upload-dir:./uploads}") String uploadDirStr,
            @Value("${app.storage.max-image-bytes:10485760}") long maxImageBytes,
            @Value("${app.storage.max-document-bytes:15728640}") long maxDocumentBytes,
            @Value("${app.storage.max-video-bytes:52428800}") long maxVideoBytes,
            AttachmentRepository attachmentRepository,
            UserRepository userRepository,
            DiscussionMessageRepository discussionMessageRepository,
            EventRepository eventRepository,
            SupportTicketMessageRepository ticketMessageRepository
    ) {
        this.uploadDir = Paths.get(uploadDirStr).toAbsolutePath().normalize();
        this.maxImageBytes = maxImageBytes;
        this.maxDocumentBytes = maxDocumentBytes;
        this.maxVideoBytes = maxVideoBytes;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.discussionMessageRepository = discussionMessageRepository;
        this.eventRepository = eventRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось инициализировать директорию хранения вложений: " + this.uploadDir, e);
        }
    }

    @Transactional
    public AttachmentDto storeFile(UUID uploaderId, MultipartFile file, String contextType) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Файл пуст или не выбран");
        }
        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        String rawName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String safeOriginalName = Paths.get(rawName).getFileName().toString()
                .replaceAll("[\\\\/:*?\"<>|]", "_");

        String ext = extractExtension(safeOriginalName);
        if (ext.isEmpty()) {
            throw ApiException.badRequest("Файл должен иметь допустимое расширение (.jpg, .png, .webp, .mp4, .pdf, .docx, .txt)");
        }

        AttachmentType attachmentType;
        String safeMimeType;
        long maxAllowed;

        if (ALLOWED_IMAGE_EXT.contains(ext)) {
            attachmentType = AttachmentType.IMAGE;
            maxAllowed = maxImageBytes;
            safeMimeType = switch (ext) {
                case "png" -> "image/png";
                case "webp" -> "image/webp";
                case "gif" -> "image/gif";
                default -> "image/jpeg";
            };
        } else if (ALLOWED_VIDEO_EXT.contains(ext)) {
            attachmentType = AttachmentType.VIDEO;
            maxAllowed = maxVideoBytes;
            safeMimeType = switch (ext) {
                case "webm" -> "video/webm";
                case "mov" -> "video/quicktime";
                default -> "video/mp4";
            };
        } else if (ALLOWED_DOC_EXT.contains(ext)) {
            attachmentType = AttachmentType.DOCUMENT;
            maxAllowed = maxDocumentBytes;
            safeMimeType = switch (ext) {
                case "pdf" -> "application/pdf";
                case "txt" -> "text/plain;charset=UTF-8";
                case "ics" -> "text/calendar;charset=UTF-8";
                default -> "application/octet-stream";
            };
        } else {
            throw ApiException.badRequest("Запрещённый формат файла (." + ext + "). Разрешены изображения (jpg, png, webp, gif), видео (mp4, webm) и документы (pdf, txt, docx, xlsx, ics).");
        }

        if (file.getSize() > maxAllowed) {
            throw ApiException.badRequest("Размер файла превышает лимит для типа " + attachmentType + " (максимум " + (maxAllowed / (1024 * 1024)) + " МБ)");
        }

        verifyMagicBytes(file, ext);

        String storedName = UUID.randomUUID() + "." + ext;
        Path targetPath = this.uploadDir.resolve(storedName).normalize();
        if (!targetPath.startsWith(this.uploadDir)) {
            throw ApiException.badRequest("Недопустимый путь сохранения файла");
        }

        try (InputStream is = file.getInputStream()) {
            Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw ApiException.badRequest("Ошибка сохранения файла на диск");
        }

        Attachment attachment = new Attachment();
        attachment.setUploader(uploader);
        attachment.setOriginalFilename(safeOriginalName);
        attachment.setStoredFilename(storedName);
        attachment.setAttachmentType(attachmentType);
        attachment.setMimeType(safeMimeType);
        attachment.setFileSize(file.getSize());
        attachment.setContextType(contextType != null ? contextType.toUpperCase(Locale.ROOT) : "DISCUSSION");

        attachment = attachmentRepository.save(attachment);
        return toDto(attachment);
    }

    @Transactional(readOnly = true)
    public Attachment getAuthorizedAttachment(UUID attachmentId, UserPrincipal viewer) {
        Attachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> ApiException.notFound("Файл вложения не найден"));

        boolean isAdmin = viewer != null && viewer.isAdmin();
        if (att.isHidden() && !isAdmin) {
            throw ApiException.forbidden("Вложение скрыто модератором и недоступно для просмотра");
        }

        // Если вложение привязано к сообщению обсуждения, проверим статус сообщения и мероприятия
        if ("DISCUSSION".equalsIgnoreCase(att.getContextType()) && att.getContextId() != null) {
            DiscussionMessage msg = discussionMessageRepository.findById(att.getContextId()).orElse(null);
            if (msg != null) {
                if (msg.getStatus() != MessageVisibilityStatus.VISIBLE && !isAdmin) {
                    throw ApiException.forbidden("Сообщение с этим вложением было скрыто модератором");
                }
                Event ev = msg.getEvent();
                if (ev.getStatus() == EventStatus.UNPUBLISHED_BY_ADMIN && !isAdmin
                        && (viewer == null || !ev.getOrganizer().getId().equals(viewer.id()))) {
                    throw ApiException.forbidden("Мероприятие снято с публикации");
                }
            }
        }

        // Если вложение привязано к тикету, доступ есть только у автора тикета и администратора
        if ("TICKET".equalsIgnoreCase(att.getContextType())) {
            if (viewer == null) {
                throw ApiException.unauthorized("Для просмотра вложения тикета необходима авторизация");
            }
            if (!isAdmin && !att.getUploader().getId().equals(viewer.id())) {
                throw ApiException.forbidden("Вы не можете просматривать вложения чужого тикета");
            }
        }

        return att;
    }

    public Path resolveFilePath(Attachment att) {
        Path p = this.uploadDir.resolve(att.getStoredFilename()).normalize();
        if (!p.startsWith(this.uploadDir) || !Files.exists(p)) {
            throw ApiException.notFound("Физический файл вложения не найден в хранилище");
        }
        return p;
    }

    public AttachmentDto toDto(Attachment att) {
        return new AttachmentDto(
                att.getId(),
                att.getOriginalFilename(),
                att.getAttachmentType(),
                att.getMimeType(),
                att.getFileSize(),
                "/api/v1/attachments/" + att.getId() + "/content",
                att.getCreatedAt()
        );
    }

    private String extractExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) return "";
        return filename.substring(idx + 1).toLowerCase(Locale.ROOT);
    }

    private void verifyMagicBytes(MultipartFile file, String ext) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = is.readNBytes(12);
            if (header.length == 0) {
                throw ApiException.badRequest("Загруженный файл пуст");
            }
            // Защита от подмены исполняемых файлов (MZ / ELF / Script shebang для бинарных типов)
            if (!ext.equals("txt") && !ext.equals("ics")) {
                if (header.length >= 2 && header[0] == 'M' && header[1] == 'Z') {
                    throw ApiException.badRequest("Обнаружен исполняемый файл Windows (EXE/DLL). Загрузка запрещена.");
                }
                if (header.length >= 4 && header[0] == 0x7F && header[1] == 'E' && header[2] == 'L' && header[3] == 'F') {
                    throw ApiException.badRequest("Обнаружен исполняемый ELF-файл. Загрузка запрещена.");
                }
            }
            if (ext.equals("pdf")) {
                if (header.length < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F') {
                    throw ApiException.badRequest("Содержимое файла не соответствует формату PDF");
                }
            }
            if (ext.equals("png")) {
                if (header.length < 4 || (header[0] & 0xFF) != 0x89 || header[1] != 'P' || header[2] != 'N' || header[3] != 'G') {
                    throw ApiException.badRequest("Содержимое файла не соответствует формату PNG");
                }
            }
        } catch (ApiException e) {
            throw e;
        } catch (IOException e) {
            throw ApiException.badRequest("Не удалось прочитать заголовок загружаемого файла");
        }
    }
}
