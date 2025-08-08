package com.diemdanh.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "students")
@Getter
@Setter
public class StudentEntity {
    @Id
    @Column(name = "mssv", nullable = false, length = 32)
    private String mssv;

    @Column(name = "ma_lop", nullable = false, length = 64)
    private String maLop;

    @Column(name = "ho_ten", nullable = false, length = 128)
    private String hoTen;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
