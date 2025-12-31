package com.homeinventory.controller;

import com.homeinventory.entity.ItemPhoto;
import com.homeinventory.repository.ItemPhotoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/item-photos")
@CrossOrigin(origins = "*")
public class ItemPhotoController {
    @Autowired
    private ItemPhotoRepository itemPhotoRepository;

    @GetMapping
    public List<ItemPhoto> getAllPhotos() {
        return itemPhotoRepository.findAll();
    }

    @GetMapping("/item/{itemId}")
    public List<ItemPhoto> getPhotosByItem(@PathVariable Long itemId) {
        return itemPhotoRepository.findByItemId(itemId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemPhoto> getPhotoById(@PathVariable Long id) {
        return itemPhotoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ItemPhoto createPhoto(@RequestBody ItemPhoto itemPhoto) {
        return itemPhotoRepository.save(itemPhoto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        if (itemPhotoRepository.existsById(id)) {
            itemPhotoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
