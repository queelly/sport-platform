package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.SkillLevel;

import java.util.UUID;

@Entity
@Table(name = "user_sport_interests")
public class UserSportInterest {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private Sport sport;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 40)
    private SkillLevel skillLevel = SkillLevel.AMATEUR;

    @Column(name = "is_primary", nullable = false)
    private boolean primarySport = false;

    @Column(name = "want_to_try_new", nullable = false)
    private boolean wantToTryNew = false;

    @Column(length = 300)
    private String note;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Sport getSport() { return sport; }
    public void setSport(Sport sport) { this.sport = sport; }
    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }
    public boolean isPrimarySport() { return primarySport; }
    public void setPrimarySport(boolean primarySport) { this.primarySport = primarySport; }
    public boolean isWantToTryNew() { return wantToTryNew; }
    public void setWantToTryNew(boolean wantToTryNew) { this.wantToTryNew = wantToTryNew; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
