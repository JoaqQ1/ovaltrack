package com.ovaltrack.backend.club.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.club.repository.ClubRepository;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;

import jakarta.transaction.Transactional;

@Service
public class ClubService {
    @Autowired
    private ClubRepository clubRepository;

    public Collection<Club> findAllClubs() {
        return clubRepository.findAll();
    }

    public Club findClubById(UUID clubId) {
        return clubRepository.findById(clubId).orElse(null);
    }

    //Paged getAll function

    //This function will assign status and creation timestamp
    @Transactional
    public Club saveClub(Club aClub) {
        //this.validateClub(aClub);  
        return clubRepository.save(aClub);
    }
    //TODO: Ask whether club's status is pending by default considering our MVP

    @Transactional
    public void deleteClub(UUID clubId) {
        //Verifications
       if (clubRepository.findById(clubId) == null) {
            throw new BusinessException("Club no encontrado");
       }
        clubRepository.deleteById(clubId);
    }


}


