export const APPLICATION_MESSAGE_PREFIX = "__PET_APP_V1__:";

export type ApplicationDetails = {
  intro: string;
  householdType: string;
  housingStatus: string;
  householdSize: string;
  childrenInfo: string;
  otherPetsInfo: string;
  workSchedule: string;
  activityLevel: string;
  experience: string;
  carePlan: string;
  timeline: string;
};

export type ParsedApplicationMessage = {
  details: ApplicationDetails | null;
  legacyMessage: string | null;
};

export const emptyApplicationDetails = (): ApplicationDetails => ({
  intro: "",
  householdType: "",
  housingStatus: "",
  householdSize: "",
  childrenInfo: "",
  otherPetsInfo: "",
  workSchedule: "",
  activityLevel: "",
  experience: "",
  carePlan: "",
  timeline: "",
});

export function serializeApplicationMessage(details: ApplicationDetails): string {
  return `${APPLICATION_MESSAGE_PREFIX}${JSON.stringify(details)}`;
}

export function parseApplicationMessage(
  value?: string | null,
): ParsedApplicationMessage {
  if (!value) {
    return { details: null, legacyMessage: null };
  }

  if (!value.startsWith(APPLICATION_MESSAGE_PREFIX)) {
    return { details: null, legacyMessage: value };
  }

  try {
    const details = JSON.parse(
      value.slice(APPLICATION_MESSAGE_PREFIX.length),
    ) as ApplicationDetails;

    return { details, legacyMessage: null };
  } catch {
    return { details: null, legacyMessage: value };
  }
}

export function applicationSummary(details: ApplicationDetails): string {
  return [
    details.intro,
    details.householdType && `Home: ${details.householdType}`,
    details.otherPetsInfo && `Other pets: ${details.otherPetsInfo}`,
    details.timeline && `Timeline: ${details.timeline}`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function hasApplicationUpdate(createdAt: string, updatedAt?: string | null) {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
}
