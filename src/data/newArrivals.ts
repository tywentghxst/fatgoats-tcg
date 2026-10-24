export interface NewArrivalsDrop {
  dropId: string;
  dropDate: string;
  dropTitle: string;
  cardIds: string[];
}

export const LATEST_DROP: NewArrivalsDrop = {
  dropId: "drop-202610232230",
  dropDate: "2026-10-23",
  dropTitle: "Party Chronicles & Stealth Chill",
  cardIds: [
    "fg-43",
    "fg-44",
    "fg-45",
    "fg-46",
    "fg-47"
  ],
};
