package com.ovaltrack.backend.event.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.dto.EventDTOMapper;
import com.ovaltrack.backend.event.domain.dto.EventTypeResponseDTO;
import com.ovaltrack.backend.event.repository.EventTypeRepository;

@Service
public class EventTypeService {

	@Autowired 
	private EventTypeRepository eventTypeRepository;

	public Collection<EventTypeResponseDTO> findAllEventTypes() {
		return eventTypeRepository.findAll().stream().map(EventDTOMapper::toResponseDTO).toList();
	}

	public EventTypeResponseDTO findEventTypeById(UUID eventTypeId) {
		EventType result = eventTypeRepository.findById(eventTypeId).orElse(null);
		return EventDTOMapper.toResponseDTO(result);
	}

	public EventType findEventTypeEntityById(UUID eventTypeId) {
		return eventTypeRepository.findById(eventTypeId).orElse(null);
	}

}
