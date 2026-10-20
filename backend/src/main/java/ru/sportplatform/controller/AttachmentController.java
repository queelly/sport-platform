package ru.sportplatform.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.sportplatform.domain.entity.Attachment;
import ru.sportplatform.domain.enums.Enums.AttachmentType;
import ru.sportplatform.dto.ApiDtos.AttachmentDto;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.FileStorageService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attachments")
public class AttachmentController {

    private static final long CHUNK_SIZE = 1024 * 1024; // 1MB chunks for video streaming

    private final FileStorageService fileStorageService;

    public AttachmentController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentDto> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "contextType", defaultValue = "DISCUSSION") String contextType
    ) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(fileStorageService.storeFile(userId, file, contextType));
    }

    @GetMapping("/{attachmentId}/content")
    public ResponseEntity<?> downloadOrStreamContent(
            @PathVariable UUID attachmentId,
            @RequestHeader HttpHeaders headers
    ) throws IOException {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        Attachment att = fileStorageService.getAuthorizedAttachment(attachmentId, viewer);
        Path filePath = fileStorageService.resolveFilePath(att);
        Resource resource = new FileSystemResource(filePath);
        long contentLength = resource.contentLength();

        String encodedFilename = URLEncoder.encode(att.getOriginalFilename(), StandardCharsets.UTF_8).replace("+", "%20");

        if (att.getAttachmentType() == AttachmentType.VIDEO && !headers.getRange().isEmpty()) {
            HttpRange range = headers.getRange().getFirst();
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(CHUNK_SIZE, end - start + 1);
            ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(MediaType.parseMediaType(att.getMimeType()))
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(region);
        }

        String dispositionType = (att.getAttachmentType() == AttachmentType.DOCUMENT) ? "attachment" : "inline";
        String asciiFallbackName = att.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(att.getMimeType()))
                .contentLength(contentLength)
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        dispositionType + "; filename=\"" + asciiFallbackName + "\"; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }
}
