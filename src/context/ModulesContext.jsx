import { createContext, useContext, useEffect, useState } from "react";
import { OPPS, EVENTS } from "../data/modules";
import { eventLibraryService } from "../services/eventLibraryService";
import { opportunitiesService } from "../services/opportunitiesService";
import { USE_MOCK } from "../services/http";
import { useAuth } from "./AuthContext";

const Ctx = createContext(null);
export const useModules = () => useContext(Ctx);

export function ModulesProvider({ children }) {
  const { user } = useAuth();
  const [opps, setOpps] = useState(OPPS);
  const [events, setEvents] = useState(EVENTS);
  const [savedEvents, setSavedEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [audit, setAudit] = useState([{ t: "Today", who: "System", a: "Scoring policy loaded", o: "VECTOR rules" }]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    return opportunitiesService.subscribe(user.uid, setOpps, (failure) => setError(failure.message));
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setSavedEvents([]);
      setCalendarEvents([]);
      return undefined;
    }
    const uid = user.uid || user.email;
    setSavedEvents([]);
    setCalendarEvents([]);
    return eventLibraryService.subscribe(
      uid,
      setSavedEvents,
      setCalendarEvents,
      (failure) => setError(failure.message)
    );
  }, [user?.uid, user?.email]);

  const saveEvent = async (event) => {
    const next = await eventLibraryService.add(user.uid || user.email, "saved", event);
    if (next) setSavedEvents(next);
  };
  const unsaveEvent = async (eventId) => {
    const next = await eventLibraryService.remove(user.uid || user.email, "saved", eventId);
    if (next) setSavedEvents(next);
  };
  const addEventToCalendar = async (event) => {
    const next = await eventLibraryService.add(user.uid || user.email, "calendar", event);
    if (next) setCalendarEvents(next);
  };
  const removeEventFromCalendar = async (eventId) => {
    const next = await eventLibraryService.remove(user.uid || user.email, "calendar", eventId);
    if (next) setCalendarEvents(next);
  };

  const createOpportunity = async (form, values) => {
    const item = await opportunitiesService.create(user, form, values);
    if (USE_MOCK) setOpps((items) => [item, ...items]);
  };
  const expressInterest = async (id) => {
    await opportunitiesService.expressInterest(id, user);
    if (USE_MOCK) {
      setOpps((items) => items.map((item) => (String(item.id) === String(id)
        ? { ...item, interested: item.interested.includes(user.name) ? item.interested : [...item.interested, user.name] }
        : item)));
    }
  };
  const acceptMember = async (id, requesterId, name) => {
    await opportunitiesService.acceptMember(id, USE_MOCK ? name : requesterId);
    if (USE_MOCK) {
      setOpps((items) => items.map((item) => (String(item.id) === String(id)
        ? { ...item, team: item.team.includes(name) ? item.team : [...item.team, name] }
        : item)));
    }
  };
  const deleteOpportunity = async (id) => {
    await opportunitiesService.remove(id);
    if (USE_MOCK) setOpps((items) => items.filter((item) => String(item.id) !== String(id)));
  };

  const log = (who, a, o) => setAudit((l) => [{ t: "Just now", who, a, o }, ...l]);
  return <Ctx.Provider value={{
    opps, events, setEvents, savedEvents, calendarEvents, saveEvent, unsaveEvent,
    addEventToCalendar, removeEventFromCalendar, audit, log, error,
    createOpportunity, expressInterest, acceptMember, deleteOpportunity,
  }}>{children}</Ctx.Provider>;
}
