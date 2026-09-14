package com.ovaltrack.backend.person.business;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.person.domain.dto.PersonCreationDTO;
import com.ovaltrack.backend.person.domain.dto.PersonDTOMapper;
import com.ovaltrack.backend.person.domain.dto.PersonResponseDTO;
import com.ovaltrack.backend.person.domain.dto.PersonUpdateDTO;
import com.ovaltrack.backend.person.repository.PersonRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.UUID;

@Service
public class PersonService {

    private final PersonRepository personRepository;

    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    public Collection<PersonResponseDTO> findAllPersons() {
        return personRepository.findAll().stream()
                .map(PersonDTOMapper::toResponseDTO)
                .toList();
    }

    public PersonResponseDTO findPersonById(UUID personId) {
        return PersonDTOMapper.toResponseDTO(findPersonEntityById(personId));
    }

    public Person findPersonEntityById(UUID personId) {
        return personRepository.findById(personId).orElse(null);
    }

    @Transactional
    public PersonResponseDTO savePerson(PersonCreationDTO request) {
        if (request.contactEmail() != null && !request.contactEmail().isBlank()
                && personRepository.existsByContactEmail(request.contactEmail())) {
            throw new BusinessException("El email de contacto ya se encuentra registrado");
        }

        Person person = PersonDTOMapper.toEntity(request);
        person = personRepository.save(person);
        return PersonDTOMapper.toResponseDTO(person);
    }

    @Transactional
    public Person savePersonEntity(Person person) {
        return personRepository.save(person);
    }

    @Transactional
    public PersonResponseDTO updatePerson(UUID personId, PersonUpdateDTO request) {
        Person person = findPersonEntityById(personId);
        if (person == null) {
            throw new BusinessException("Persona no encontrada");
        }

        if (request.contactEmail() != null && !request.contactEmail().isBlank()
                && !request.contactEmail().equalsIgnoreCase(person.getContactEmail())
                && personRepository.existsByContactEmail(request.contactEmail())) {
            throw new BusinessException("El email de contacto ya está registrado por otra persona");
        }

        person.setFirstName(request.firstName());
        person.setLastName(request.lastName());
        person.setBirthDate(request.birthDate());
        person.setContactEmail(request.contactEmail());
        person.setContactPhone(request.contactPhone());

        person = personRepository.save(person);
        return PersonDTOMapper.toResponseDTO(person);
    }

    @Transactional
    public void deletePerson(UUID personId) {
        if (!personRepository.existsById(personId)) {
            throw new BusinessException("Persona no encontrada");
        }
        personRepository.deleteById(personId);
    }
}
