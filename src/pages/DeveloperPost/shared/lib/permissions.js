export const canReadDeveloperPosts = (auth) => Boolean(auth?.user?.permissions?.pages?.["developer-posts"]?.read);

export const canCreateDeveloperPost = (auth) => Boolean(auth?.user?.permissions?.pages?.["developer-posts"]?.create);

// developer-posts.update — individual-скоуп (App\Enums\Permission::isIndividualScoped()):
// true — будь-які пости (тімлід), 'individual' — лише власні, false/відсутнє — немає доступу.
export const canManageDeveloperPost = (auth, post) => {
    const scope = auth?.user?.permissions?.pages?.["developer-posts"]?.update;
    if (scope === true) return true;
    if (scope === "individual") return Number(post?.author_id) === Number(auth?.user?.id);
    return false;
};
