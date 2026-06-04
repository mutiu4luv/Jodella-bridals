export type UserRole = 'user' | 'admin'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type AuthPayload = {
  token: string
  user: SessionUser
}

export type FormSubmission = {
  _id: string
  brideName: string
  bridePhone: string
  homeAddress: string
  socialAddress: string
  weddingDate: string
  husbandName: string
  husbandPhone: string
  husbandAddress: string
  stateCity: string
  churchAddress: string
  weddingCardCopyType: string
  packageName: string
  packageAllItems: boolean
  packageItemA: string
  packageItemB: string
  packageItemC: string
  packageItemD: string
  packageItemE: string
  packageItemF: string
  removedItems: string
  cautionFeeAcknowledged: boolean
  identificationSubmitted: boolean
  adjustmentAcknowledged: boolean
  returnDurationAcknowledged: boolean
  pickupAcknowledged: boolean
  fireworksAcknowledged: boolean
  cancellationAcknowledged: boolean
  damagedItemAcknowledged: boolean
  valueAcknowledged: boolean
  customerSignature: string
  consultantSignature: string
  mdSignature: string
  signatureDate: string
  submittedBy?: SessionUser
  createdAt: string
}
