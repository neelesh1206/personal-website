import { db } from './index'
import { contacts, type NewContact } from './schema'

export async function saveContact(data: NewContact) {
  const [contact] = await db.insert(contacts).values(data).returning()
  return contact
}

export async function getAllContacts() {
  return db.select().from(contacts).orderBy(contacts.createdAt)
}
