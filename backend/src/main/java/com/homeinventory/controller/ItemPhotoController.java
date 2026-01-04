package com.homeinventory.controller;

import com.homeinventory.entity.Item;
import com.homeinventory.entity.ItemPhoto;
import com.homeinventory.repository.ItemPhotoRepository;
import com.homeinventory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/item-photos")
@CrossOrigin(origins = "*")
public class ItemPhotoController {
    @Autowired
    private ItemPhotoRepository itemPhotoRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

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

    @PostMapping("/upload/{itemId}")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long itemId, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload");
        }

        try {
            // Find the item
            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Item not found"));

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = Paths.get(uploadDir, filename);
            Files.write(filePath, file.getBytes());

            // Save photo record
            ItemPhoto itemPhoto = new ItemPhoto();
            itemPhoto.setItem(item);
            itemPhoto.setPhotoPath(filename);
            ItemPhoto savedPhoto = itemPhotoRepository.save(itemPhoto);

            return ResponseEntity.ok(savedPhoto);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ItemPhoto createPhoto(@RequestBody ItemPhoto itemPhoto) {
        return itemPhotoRepository.save(itemPhoto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        if (itemPhotoRepository.existsById(id)) {
            ItemPhoto photo = itemPhotoRepository.findById(id).get();

            // Delete physical file
            try {
                Path filePath = Paths.get(uploadDir, photo.getPhotoPath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log error but continue with database deletion
                System.err.println("Failed to delete file: " + e.getMessage());
            }

            itemPhotoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
