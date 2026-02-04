import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Field {
    id: FieldId;
    avgUrgency: bigint;
    totalTaskDuration: bigint;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    avgInterest: bigint;
    totalTaskCount: bigint;
    taskCount: bigint;
    avgInfluence: bigint;
    avgValue: bigint;
    totalActiveTaskDuration: bigint;
}
export type Time = bigint;
export type TaskId = string;
export type FieldId = string;
export interface Task {
    id: TaskId;
    durationUnit: DurationUnit;
    duration: bigint;
    urgency: bigint;
    interest: bigint;
    value: bigint;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    completed: boolean;
    influence: bigint;
    dependencies: Array<TaskId>;
    fieldId: FieldId;
}
export interface UserProfile {
    name: string;
}
export enum DurationUnit {
    hours = "hours",
    days = "days",
    minutes = "minutes"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createField(name: string): Promise<FieldId>;
    createTask(fieldId: FieldId, name: string, urgency: bigint, value: bigint, interest: bigint, influence: bigint, duration: bigint, durationUnit: DurationUnit, dependencies: Array<TaskId>): Promise<TaskId>;
    deleteField(fieldId: FieldId): Promise<void>;
    deleteTask(taskId: TaskId): Promise<void>;
    filterTasksByAttribute(fieldId: FieldId, attribute: string, minValue: bigint, maxValue: bigint): Promise<Array<Task>>;
    getAllFields(): Promise<Array<Field>>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTasksByField(fieldId: FieldId): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markTaskCompleted(taskId: TaskId): Promise<void>;
    moveTaskToField(taskId: TaskId, newFieldId: FieldId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchTasks(fieldId: FieldId, searchTerm: string): Promise<Array<Task>>;
    undoTaskCompletion(taskId: TaskId): Promise<void>;
    updateField(fieldId: FieldId, name: string): Promise<void>;
    updateTask(taskId: TaskId, name: string, urgency: bigint, value: bigint, interest: bigint, influence: bigint, duration: bigint, durationUnit: DurationUnit, dependencies: Array<TaskId>): Promise<void>;
}
