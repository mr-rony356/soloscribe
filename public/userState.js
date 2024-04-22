let currentUserId = null;

export function setCurrentUserId(uid) {
    currentUserId = uid;
}

export function getCurrentUserId() {
    return currentUserId;
}
