package com.diemdanh.repo;

import com.diemdanh.domain.StudentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentRepository extends JpaRepository<StudentEntity, String> {

    Page<StudentEntity> findByMaLopContainingIgnoreCase(String maLop, Pageable pageable);

    Page<StudentEntity> findByHoTenContainingIgnoreCase(String hoTen, Pageable pageable);

    Page<StudentEntity> findByMssvContainingIgnoreCaseOrHoTenContainingIgnoreCaseOrMaLopContainingIgnoreCase(
        String mssv, String hoTen, String maLop, Pageable pageable);

    List<StudentEntity> findByMaLopOrderByHoTenAsc(String maLop);

    @Query("SELECT COUNT(s) FROM StudentEntity s WHERE s.maLop = :maLop")
    long countByMaLop(@Param("maLop") String maLop);

    @Query("SELECT DISTINCT s.maLop FROM StudentEntity s ORDER BY s.maLop")
    List<String> findDistinctMaLop();

    boolean existsByMssvAndMaLop(String mssv, String maLop);

    // Methods for teacher-specific queries
    Page<StudentEntity> findByMaLopInAndHoTenContainingIgnoreCase(List<String> maLopList, String hoTen, Pageable pageable);

    Page<StudentEntity> findByMaLopIn(List<String> maLopList, Pageable pageable);

    long countByMaLopIn(List<String> maLopList);
}
