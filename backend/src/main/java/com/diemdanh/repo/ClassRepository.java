package com.diemdanh.repo;

import com.diemdanh.domain.ClassEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    
    /**
     * Find classes created by a specific teacher
     */
    Page<ClassEntity> findByCreatedByUsername(String username, Pageable pageable);
    
    /**
     * Find classes created by a specific teacher with search
     */
    Page<ClassEntity> findByCreatedByUsernameAndMaLopContainingIgnoreCase(
        String username, String search, Pageable pageable);
    
    /**
     * Find classes created by a specific teacher with name search
     */
    Page<ClassEntity> findByCreatedByUsernameAndTenLopContainingIgnoreCase(
        String username, String search, Pageable pageable);
    
    /**
     * Find classes created by a specific teacher with search in both code and name
     */
    @Query("SELECT c FROM ClassEntity c WHERE c.createdByUsername = :username AND " +
           "(LOWER(c.maLop) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.tenLop) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ClassEntity> findByCreatedByUsernameAndSearch(
        @Param("username") String username, 
        @Param("search") String search, 
        Pageable pageable);
    
    /**
     * Get list of class codes created by a teacher
     */
    @Query("SELECT c.maLop FROM ClassEntity c WHERE c.createdByUsername = :username")
    List<String> findMaLopByCreatedByUsername(@Param("username") String username);
    
    /**
     * Count classes created by a teacher
     */
    long countByCreatedByUsername(String username);
    
    /**
     * Check if a teacher already created a specific class code
     */
    boolean existsByMaLopAndCreatedByUsername(String maLop, String createdByUsername);
    
    /**
     * Find class by code and teacher
     */
    ClassEntity findByMaLopAndCreatedByUsername(String maLop, String createdByUsername);
    
    /**
     * Check if any class with this code exists (regardless of teacher)
     */
    boolean existsByMaLop(String maLop);
}
