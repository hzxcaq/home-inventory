package com.homeinventory.controller;

import com.homeinventory.entity.StorageLocation;
import com.homeinventory.repository.StorageLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/storage-locations")
@CrossOrigin(origins = "*")
public class StorageLocationController {
    @Autowired
    private StorageLocationRepository storageLocationRepository;

    @GetMapping
    public List<StorageLocation> getAllStorageLocations() {
        return storageLocationRepository.findAll();
    }

    @GetMapping("/room/{roomId}")
    public List<StorageLocation> getStorageLocationsByRoom(@PathVariable Long roomId) {
        return storageLocationRepository.findByRoomId(roomId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StorageLocation> getStorageLocationById(@PathVariable Long id) {
        return storageLocationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public StorageLocation createStorageLocation(@RequestBody StorageLocation storageLocation) {
        return storageLocationRepository.save(storageLocation);
    }

    @PostMapping("/batch")
    public List<StorageLocation> createStorageLocationsBatch(@RequestBody List<StorageLocation> locations) {
        return storageLocationRepository.saveAll(locations);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StorageLocation> updateStorageLocation(@PathVariable Long id, @RequestBody StorageLocation details) {
        return storageLocationRepository.findById(id)
                .map(location -> {
                    location.setName(details.getName());
                    location.setType(details.getType());
                    location.setPositionX(details.getPositionX());
                    location.setPositionY(details.getPositionY());
                    location.setRoom(details.getRoom());
                    return ResponseEntity.ok(storageLocationRepository.save(location));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStorageLocation(@PathVariable Long id) {
        if (storageLocationRepository.existsById(id)) {
            storageLocationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

