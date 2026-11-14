# Community feature: smallest safe fix

## What the audit found (from the code, nothing changed)
- The community screens use 5 database objects that don't exist in the live database: `communities`, `community_members`, `community_channels`, `community_invites`, `channel_messages`, plus the `accept_community_invite(p_invite_code)` function. Right now every community action fails.
- `createCommunity` runs 3 separate client inserts (community, then owner membership, then default channels) and tries to undo them if one fails. That undo isn't reliable.
- Joining, role changes, kicking members, and creating/renaming/deleting channels all write directly from the browser. The app only checks for owner/admin on screen (`CommunityView.tsx:86`). Nothing on the server enforces it yet.
- `channel_messages` sends ignore errors (`useChannelChat.ts:97`). Community attachments call `getPublicUrl` on the private `chat-attachments` storage (`CommunityView.tsx:459`), so those links will never load.
- `fetchCommunities` only loads public communities, so private communities you belong to never show up in "My communities".
- Voice (`useVoiceChat.ts`) and presence (`usePresence.ts`) only use live broadcast channels, not tables. Any signed-in user who knows a channel id can join a voice room.

## Plan (one migration plus small hook edits)

### 1. Tables (with grants and row-level security)
- `communities`: id, name (1 to 100 characters), description, icon, owner_id, is_public (default true), created_at, updated_at.
- `community_members`: community_id, user_id, role (owner, admin, moderator, member), joined_at. Each user can only be a member once per community.
- `community_channels`: community_id, name, type (text or voice), position, created_at.
- `community_invites`: community_id, created_by, invite_code (unique, random, generated on the server), max_uses, uses (default 0), expires_at, is_active, created_at.
- `channel_messages`: channel_id, sender_id, content (1 to 4000 characters), file_url, file_name, file_type, created_at.
- Helper functions that run with elevated rights and use a fixed search_path: `is_community_member(cid, uid)` and `community_role(cid, uid)`. Policies call these so they don't query their own tables recursively.
- Grants: signed-in users only. No grants for signed-out visitors.

### 2. Who can do what (row-level security)
- **Communities:** You can read a community if it's public or you're a member. Only the owner can update it. Only the owner can delete it. Nobody can insert directly; new communities go through the RPC below.
- **Members:** Members of a community can read its member list. You can add only yourself, as a plain member, and only to a public community. You can remove yourself, unless you're the owner. Owners and admins can remove non-owners. Role changes go only through an RPC; direct updates are blocked.
- **Channels:** Members can read channels. Owners and admins can create, rename and delete them.
- **Invites:** Owners and admins can read, create and revoke them. Accepting an invite goes only through the RPC.
- **Channel messages:** Members of the channel's community can read messages and send their own (sender_id must be you). Senders can delete their own messages. Editing is not allowed.

### 3. RPCs (each one runs as a single transaction)
- `create_community(name, description, icon, is_public)`: creates the community, the owner membership and both default channels in one step, then returns the row.
- `accept_community_invite(p_invite_code)`: locks the invite and checks that it's active, not expired and under its use limit. It adds you as a member, or returns `already_member`, and increases `uses`. It returns `{community_id, already_member}` or `{error}`, which is the format the hook already expects.
- `set_community_member_role(cid, uid, role)`: only the owner can make someone admin. Owners and admins can set moderator or member. Nobody can change or assign the owner role.

### 4. Live updates
- Add `channel_messages` to live updates so the existing chat subscription works.

### 5. Small code edits
- `useCommunities.createCommunity`: call `create_community` and remove the client-side undo.
- `updateMemberRole`: call `set_community_member_role`.
- `fetchCommunities`: also load the communities you're a member of, and surface errors.
- `useChannelChat.sendMessage`: check for errors and show them to the user.
- `CommunityView` attachments: switch to signed URLs, matching how direct messages already handle attachments.

### Checks
- Typecheck.
- Live database checks of grants and policies.
- A two-account test: a non-member can't read a private community's messages, and a plain member can't create channels or change roles.

## NOT in this turn (too broad or risky)
- **Voice room authorization.** Real-time channel authorization needs private channels plus policies on `realtime.messages`, and the WebRTC code would have to change too. For now, flag that anyone with a channel id can join a voice room.
- **Presence privacy.** The global "online-users" presence is visible to every signed-in user. Changing that is a separate design decision.
- **Transferring ownership,** deleting a community along with its storage files, and moderation tools (bans, deleting other people's messages).
- **Long-term attachment access** for community members. Today's private storage only lets the uploader read the file, and signed links expire, the same limit as direct messages. Fixing this means redesigning storage policies.
- **Rate limits** on messages and invites, and Discord-style channel permission overrides.
- Rewriting the community screens or replacing the `as any` casts beyond the lines above.
