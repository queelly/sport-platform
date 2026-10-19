package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_application_history")
public class OrganizationApplicationHistory {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "submitted_snapshot", nullable = false, length = 4000)
    private String submittedSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrganizationStatus status;

    @Column(name = "decision_reason", length = 1500)
    private String decisionReason;

    @Column(name = "decided_by_admin_id")
    private UUID decidedByAdminId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public int getVersionNumber() { return versionNumber; }
    public void setVersionNumber(int versionNumber) { this.versionNumber = versionNumber; }
    public String getSubmittedSnapshot() { return submittedSnapshot; }
    public void setSubmittedSnapshot(String submittedSnapshot) { this.submittedSnapshot = submittedSnapshot; }
    public OrganizationStatus getStatus() { return status; }
    public void setStatus(OrganizationStatus status) { this.status = status; }
    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
    public UUID getDecidedByAdminId() { return decidedByAdminId; }
    public void setDecidedByAdminId(UUID decidedByAdminId) { this.decidedByAdminId = decidedByAdminId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
