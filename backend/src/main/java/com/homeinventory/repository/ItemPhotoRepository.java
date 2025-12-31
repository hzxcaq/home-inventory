package com.homeinventory.repository;

import com.homeinventory.entity.ItemPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemPhotoRepository extends JpaRepository<ItemPhoto, Long> {
    List<ItemPhoto> findByItemId(Long itemId);
}
