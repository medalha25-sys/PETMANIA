export type DbResult<T> = {
    data: T | null;
    error: any;
};

// Database Row Types (Approximate based on usage)
export interface DbPet {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
    weight: number | null;
    sex: string | null;
    avatar_url: string | null;
    owner_id: string;
    created_at?: string;
}

export interface DbClient {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
    phone: string | null;
}

// Joined Types
export interface PetWithOwner extends DbPet {
    owner?: {
        full_name: string;
    };
}
