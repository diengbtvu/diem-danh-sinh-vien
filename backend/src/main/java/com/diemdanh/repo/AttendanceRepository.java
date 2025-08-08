package com.diemdanh.repo;

import com.diemdanh.domain.AttendanceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceEntity, UUID> {
    Page<AttendanceEntity> findByQrCodeValueContaining(String sessionId, Pageable pageable);
}
