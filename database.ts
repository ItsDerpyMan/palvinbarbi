
// database layout
// Room
// - id: string
// - name: string
// - created: number    / timestamp
// - hasStarted: boolean
// - started: number    / timestamp
// - players: user_id[]
//
// User
// - id: string
// - SessionId: string
// - username: string
// - preferences: {
//  theme: light | dark
// }
// - roomSession: refRoom | null

// utils/db.ts
export interface Room {
    id: string;
    name: string;
    created: number;
    has_started: boolean;
    started: number;
    players: string[];
}

export interface RoomSession {
    room: string;
    user: string;
    joined: number;
}

export interface User {
    id: string;
    session_id: string;
    username: string;
    preferences: {
        theme: "light" | "dark";
        notifications: boolean;
    };
    room_session: RoomSession | null;
}

// Open KV instance
export async function getKv() {
    return await Deno.openKv();
}

// --- Room Operations ---
const ROOM_KEY_PREFIX = ["rooms"] as const;

export async function createRoom(
    kv: Deno.Kv,
    room: Omit<Room, "id" | "created" | "has_started" | "started" | "players">
) {
    const roomId = crypto.randomUUID();
    const newRoom: Room = {
        ...room,
        id: roomId,
        created: Date.now(),
        has_started: false,
        started: -1,
        players: [],
    };
    await kv.set([...ROOM_KEY_PREFIX, roomId], newRoom);
    // Create RoomSession and update user
    await joinRoom(kv, room.createdBy, roomId);
    return newRoom;
}

export async function getRoom(kv: Deno.Kv, roomId: string) {
    const result = await kv.get<Room>([...ROOM_KEY_PREFIX, roomId]);
    return result.value;
}

export async function listRooms(kv: Deno.Kv) {
    const rooms: Room[] = [];
    for await (const entry of kv.list<Room>({ prefix: ROOM_KEY_PREFIX })) {
        rooms.push(entry.value);
    }
    return rooms;
}

export async function startRoom(kv: Deno.Kv, roomId: string) {
    const room = await getRoom(kv, roomId);
    if (!room) throw new Error("Room not found");
    await kv.set([...ROOM_KEY_PREFIX, roomId], {
        ...room,
        has_started: true,
        started: Date.now(),
    });
}

// --- User Operations ---
const USER_KEY_PREFIX = ["users"] as const;
const USER_BY_SESSION_PREFIX = ["users_by_session"] as const;

export async function createUser(
    kv: Deno.Kv,
    user: Omit<User, "id" | "room_session"> & { session_id: string }
) {
    const userId = crypto.randomUUID();
    const newUser: User = {
        ...user,
        id: userId,
        room_session: null,
    };
    await kv.atomic()
        .set([...USER_KEY_PREFIX, userId], newUser)
        .set([...USER_BY_SESSION_PREFIX, user.session_id], { userId })
        .commit();
    return newUser;
}

export async function getUserBySession(kv: Deno.Kv, sessionId: string) {
    const sessionEntry = await kv.get<{ userId: string }>([
        ...USER_BY_SESSION_PREFIX,
        sessionId,
    ]);
    if (!sessionEntry.value) return null;
    const user = await kv.get<User>([...USER_KEY_PREFIX, sessionEntry.value.userId]);
    return user.value;
}

export async function getUser(kv: Deno.Kv, userId: string) {
    const user = await kv.get<User>([...USER_KEY_PREFIX, userId]);
    return user.value;
}

// --- RoomSession Operations ---
const ROOM_SESSION_PREFIX = ["room_sessions"] as const;

export async function joinRoom(kv: Deno.Kv, userId: string, roomId: string) {
    const room = await getRoom(kv, roomId);
    const user = await getUser(kv, userId);
    if (!room || !user) return false;

    const roomSession: RoomSession = {
        room: roomId,
        user: userId,
        joined: Date.now(),
    };

    await kv.atomic()
        .set([...ROOM_KEY_PREFIX, roomId], {
            ...room,
            players: [...new Set([...room.players, userId])],
        })
        .set([...USER_KEY_PREFIX, userId], {
            ...user,
            room_session: roomSession,
        })
        .set([...ROOM_SESSION_PREFIX, roomId, userId], roomSession)
        .commit();
    return true;
}

export async function leaveRoom(kv: Deno.Kv, userId: string, roomId: string) {
    const room = await getRoom(kv, roomId);
    const user = await getUser(kv, userId);
    if (!room || !user) return false;

    await kv.atomic()
        .set([...ROOM_KEY_PREFIX, roomId], {
            ...room,
            players: room.players.filter((id) => id !== userId),
        })
        .set([...USER_KEY_PREFIX, userId], {
            ...user,
            room_session: null,
        })
        .delete([...ROOM_SESSION_PREFIX, roomId, userId])
        .commit();
    return true;
}

export async function listUsersInRoom(kv: Deno.Kv, roomId: string) {
    const users: User[] = [];
    for await (const entry of kv.list<RoomSession>({ prefix: [...ROOM_SESSION_PREFIX, roomId] })) {
        const user = await getUser(kv, entry.value.user);
        if (user) users.push(user);
    }
    return users;
}