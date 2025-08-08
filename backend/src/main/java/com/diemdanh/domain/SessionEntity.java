package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sessions")
@Getter
@Setter
public class SessionEntity {
    @Id
    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "ma_lop", nullable = false, length = 64)
    private String maLop;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "rotate_seconds", nullable = false)
    private int rotateSeconds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

