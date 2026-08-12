import { collection, CollectionReference, DocumentData } from "firebase/firestore";
import { db } from "./app";
import {
  Organization,
  User,
  Project,
  ProjectTask,
  Document as DocumentDoc,
  StorageFile
} from "./types";

const getCollectionRef = <T = DocumentData>(name: string) => {
  return collection(db, name) as CollectionReference<T>;
};

export const editorCollections = {
  organizations: () => getCollectionRef<Organization>("organizations"),
  users: () => getCollectionRef<User>("users"),
  projects: () => getCollectionRef<Project>("projects"),
  tasks: () => getCollectionRef<ProjectTask>("tasks"),
  documents: () => getCollectionRef<DocumentDoc>("documents"),
  files: () => getCollectionRef<StorageFile>("files")
};
