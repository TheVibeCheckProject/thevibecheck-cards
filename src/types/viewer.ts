
// src/types/viewer.ts

export interface ViewerResponse {
    card: {
        title: string;
        senderName: string; // From User metadata or email
    };
    faces: {
        front: string; // Signed URL
        inside_left: string;
        inside_right: string;
    };
}

export interface DeliveryResponse {
    token: string;
    url: string;
}