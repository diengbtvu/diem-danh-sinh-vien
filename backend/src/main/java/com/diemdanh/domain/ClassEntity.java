package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "classes")
@Data
public class ClassEntity {
    @Id
    @Column(name = "ma_lop", length = 50)
    private String maLop;

    @Column(name = "ten_lop", length = 200)
    private String tenLop;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @Column(name = "created_by_username", length = 50)
    private String createdByUsername;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
