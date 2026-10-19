package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;
import ru.sportplatform.domain.enums.Enums.OrganizationType;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "org_type", nullable = false, length = 50)
    private OrganizationType orgType = OrganizationType.SPORTS_CLUB;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(name = "representative_name", nullable = false, length = 120)
    private String representativeName;

    @Column(name = "moderation_contact", nullable = false, length = 250)
    private String moderationContact;

    @Column(name = "public_contacts", length = 300)
    private String publicContacts;

    @Column(name = "website_url", length = 300)
    private String websiteUrl;

    @Column(name = "social_url", length = 300)
    private String socialUrl;

    @Column(name = "verification_link", length = 400)
    private String verificationLink;

    @Column(name = "extra_moderation_info", length = 1500)
    private String extraModerationInfo;

    @Column(name = "logo_attachment_id")
    private UUID logoAttachmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrganizationStatus status = OrganizationStatus.PENDING_REVIEW;

    @Column(name = "rejection_reason", length = 1500)
    private String rejectionReason;

    @Column(name = "admin_notes", length = 1500)
    private String adminNotes;

    @Column(name = "submission_version", nullable = false)
    private int submissionVersion = 1;

    @Column(name = "reviewed_by_admin_id")
    private UUID reviewedByAdminId;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "organization_sports",
            joinColumns = @JoinColumn(name = "organization_id"),
            inverseJoinColumns = @JoinColumn(name = "sport_id")
    )
    private Set<Sport> sports = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public OrganizationType getOrgType() { return orgType; }
    public void setOrgType(OrganizationType orgType) { this.orgType = orgType; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String representativeName) { this.representativeName = representativeName; }
    public String getModerationContact() { return moderationContact; }
    public void setModerationContact(String moderationContact) { this.moderationContact = moderationContact; }
    public String getPublicContacts() { return publicContacts; }
    public void setPublicContacts(String publicContacts) { this.publicContacts = publicContacts; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getSocialUrl() { return socialUrl; }
    public void setSocialUrl(String socialUrl) { this.socialUrl = socialUrl; }
    public String getVerificationLink() { return verificationLink; }
    public void setVerificationLink(String verificationLink) { this.verificationLink = verificationLink; }
    public String getExtraModerationInfo() { return extraModerationInfo; }
    public void setExtraModerationInfo(String extraModerationInfo) { this.extraModerationInfo = extraModerationInfo; }
    public UUID getLogoAttachmentId() { return logoAttachmentId; }
    public void setLogoAttachmentId(UUID logoAttachmentId) { this.logoAttachmentId = logoAttachmentId; }
    public OrganizationStatus getStatus() { return status; }
    public void setStatus(OrganizationStatus status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public int getSubmissionVersion() { return submissionVersion; }
    public void setSubmissionVersion(int submissionVersion) { this.submissionVersion = submissionVersion; }
    public UUID getReviewedByAdminId() { return reviewedByAdminId; }
    public void setReviewedByAdminId(UUID reviewedByAdminId) { this.reviewedByAdminId = reviewedByAdminId; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public Set<Sport> getSports() { return sports; }
    public void setSports(Set<Sport> sports) { this.sports = sports; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
