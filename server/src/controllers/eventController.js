import { Event } from '../models/Event.js';

export const listEvents = async (req, res) => {
  try {
    const { eventType, status = 'active' } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (eventType && ['watch_party', 'theatre_outing'].includes(eventType)) {
      query.eventType = eventType;
    }

    // List events scheduled in the future or active
    const events = await Event.find(query).sort({ dateTime: 1 }).limit(50);
    
    // Annotate with user RSVP status if authenticated
    const currentUserId = req.user?._id?.toString();
    const formatted = events.map(ev => {
      const isOrganizer = currentUserId && ev.organizerId.toString() === currentUserId;
      const isAttending = currentUserId && ev.attendees.some(a => a.userId.toString() === currentUserId);
      const isFull = ev.attendees.length >= ev.maxAttendees;

      return {
        ...ev.toObject(),
        attendeesCount: ev.attendees.length,
        isOrganizer,
        isAttending,
        isFull
      };
    });

    res.json({ count: formatted.length, events: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list Gather events', message: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      movie,
      eventType = 'theatre_outing',
      dateTime,
      venue,
      city = 'Mumbai, India',
      maxAttendees = 10
    } = req.body;

    if (!title || !venue || !dateTime || !movie?.tmdbId || !movie?.title) {
      return res.status(400).json({
        error: 'Please provide event title, venue, date & time, and select a movie.'
      });
    }

    const eventDate = new Date(dateTime);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: 'Invalid event date and time.' });
    }

    const userId = req.user._id;
    const userName = req.user.name;
    const userAvatar = req.user.avatar;

    const newEvent = await Event.create({
      title: title.trim(),
      description: description?.trim() || '',
      movie: {
        tmdbId: Number(movie.tmdbId),
        mediaType: movie.mediaType || 'movie',
        title: movie.title,
        posterPath: movie.posterPath || '',
        releaseDate: movie.releaseDate || ''
      },
      eventType,
      dateTime: eventDate,
      venue: venue.trim(),
      city: city.trim(),
      maxAttendees: Math.min(Math.max(Number(maxAttendees) || 10, 2), 100),
      organizerId: userId,
      organizerName: userName,
      organizerAvatar: userAvatar || '',
      attendees: [
        {
          userId,
          userName,
          userAvatar,
          joinedAt: new Date()
        }
      ]
    });

    res.status(201).json({
      message: 'Gather event created successfully!',
      event: newEvent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event', message: err.message });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userName = req.user.name;
    const userAvatar = req.user.avatar;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ error: 'This event has been cancelled by the organizer.' });
    }

    const alreadyJoined = event.attendees.some(a => a.userId.toString() === userId.toString());
    if (alreadyJoined) {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'This event has reached maximum attendee capacity.' });
    }

    event.attendees.push({
      userId,
      userName,
      userAvatar,
      joinedAt: new Date()
    });

    await event.save();
    res.json({ message: 'RSVP confirmed! See you at the gathering.', event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join event', message: err.message });
  }
};

export const leaveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.organizerId.toString() === userId) {
      return res.status(400).json({
        error: 'As the organizer, you cannot leave your own event. You can cancel it instead.'
      });
    }

    const initialLength = event.attendees.length;
    event.attendees = event.attendees.filter(a => a.userId.toString() !== userId);

    if (event.attendees.length === initialLength) {
      return res.status(400).json({ error: 'You were not registered for this event.' });
    }

    await event.save();
    res.json({ message: 'RSVP removed.', event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave event', message: err.message });
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.organizerId.toString() !== userId) {
      return res.status(403).json({ error: 'Only the event organizer can cancel this event.' });
    }

    event.status = 'cancelled';
    await event.save();
    res.json({ message: 'Event has been cancelled.', event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel event', message: err.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const created = await Event.find({ organizerId: userId }).sort({ dateTime: 1 });
    const joined = await Event.find({
      'attendees.userId': userId,
      organizerId: { $ne: userId }
    }).sort({ dateTime: 1 });

    res.json({
      created,
      joined
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal events', message: err.message });
  }
};
