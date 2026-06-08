export async function getLiffProfile() {
    try {
        const profile =
            await liff.getProfile();

        return {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
        };
    } catch (error) {
        console.error(error);

        return null;
    }
}