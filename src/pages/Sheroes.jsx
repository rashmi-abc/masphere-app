import { useEffect, useRef, useState } from "react";
import { Av, Ic } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { sheroesService } from "../services/sheroesService";
import { useUI } from "../context/UIContext";

const today = () => new Date().toISOString().slice(0, 10);
const nextWeek = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};
export default function Sheroes() {
  const { user } = useAuth();
  const { tt } = useUI();
  const isWoman = ["woman", "female"].includes(String(user.gender || "").trim().toLowerCase());
  const [tab, setTab] = useState("Feed");
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState("Daily moment");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const imageInput = useRef(null);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    activity: "Walking steps",
    target: "35000",
    startDate: today(),
    endDate: nextWeek(),
  });
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  useEffect(() => {
    if (!isWoman) return undefined;
    setCheckingAccess(true);
    const onError = (reason) => {
      setError(reason.message);
      setCheckingAccess(false);
    };
    return sheroesService.subscribeMembership(
      user.uid || user.email,
      (member) => {
        setHasAccess(member);
        setCheckingAccess(false);
        if (!member) {
          sheroesService.enableMembership(user).catch((reason) => {
            setError(reason.message);
          });
        }
      },
      onError
    );
  }, [isWoman, user.uid, user.email]);

  useEffect(() => {
    if (!hasAccess) {
      setPosts([]);
      setChallenges([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");
    let postsReady = false;
    let challengesReady = false;
    const markReady = () => {
      if (postsReady && challengesReady) setLoading(false);
    };
    const onError = (reason) => {
      setError(reason.message);
      setLoading(false);
    };
    const unsubscribePosts = sheroesService.subscribePosts((items) => {
      setPosts(items);
      postsReady = true;
      markReady();
    }, onError);
    const unsubscribeChallenges = sheroesService.subscribeChallenges((items) => {
      setChallenges(items);
      challengesReady = true;
      markReady();
    }, onError);
    return () => {
      unsubscribePosts();
      unsubscribeChallenges();
    };
  }, [hasAccess]);

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) {
      tt("Choose an image no larger than 10 MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const publishPost = async (event) => {
    event.preventDefault();
    setPosting(true);
    try {
      await sheroesService.createPost(user, { text: postText, category: postCategory, imageFile });
      setPostText("");
      setImageFile(null);
      setImagePreview("");
      tt("Your Sheroes post is live");
    } catch (reason) {
      tt(reason.message);
    } finally {
      setPosting(false);
    }
  };

  const publishChallenge = async (event) => {
    event.preventDefault();
    setCreatingChallenge(true);
    try {
      await sheroesService.createChallenge(user, challengeForm);
      setChallengeForm({
        title: "",
        description: "",
        activity: "Walking steps",
        target: "35000",
        startDate: today(),
        endDate: nextWeek(),
      });
      tt("Challenge created");
    } catch (reason) {
      tt(reason.message);
    } finally {
      setCreatingChallenge(false);
    }
  };

  if (checkingAccess) {
    return <div className="sheroes"><div className="card empty">Checking Sheroes access…</div></div>;
  }

  if (!hasAccess) {
    return (
      <div className="sheroes">
        <div className="sh-hero">
          <div className="sh-mark"><Ic n="heart" f /></div>
          <div><span className="sh-eyebrow">A community within MaSphere</span><h1>Sheroes</h1></div>
          <p>Share the little wins, build healthy habits, and cheer one another on.</p>
        </div>
        <section className="card sh-access">
          <div className="sh-access-icon"><Ic n="users" s={26} /></div>
          <h2>Setting up your Sheroes access</h2>
          <p>Access is based on the Gender saved in your MaSphere profile.</p>
          {error && <div className="sh-error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
        </section>
      </div>
    );
  }

  return (
    <div className="sheroes">
      <div className="sh-hero">
        <div className="sh-mark"><Ic n="heart" f /></div>
        <div><span className="sh-eyebrow">A community within MaSphere</span><h1>Sheroes</h1></div>
        <p>Share the little wins, build healthy habits, and cheer one another on.</p>
      </div>
      <div className="sh-tabs" role="tablist" aria-label="Sheroes sections">
        {["Feed", "Challenges", "My activity"].map((item) => (
          <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {error && <div className="sh-error" role="alert">{error}</div>}
      {loading ? (
        <div className="card empty">Loading Sheroes…</div>
      ) : (
        <>
          {tab === "Feed" && (
            <div className="sh-layout">
              <main className="sh-feed">
                <form className="card sh-composer" onSubmit={publishPost}>
                  <input ref={imageInput} className="sh-image-input" type="file" accept="image/*" aria-label="Choose an image for your post" onChange={selectImage} />
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <Av n={user.name} s={42} src={user.avatar} />
                    <div className="sh-composer-title"><b>What would you like to celebrate today?</b><span>Share an experience, daily activity, or a small win.</span></div>
                  </div>
                  <textarea aria-label="Write a Sheroes post" maxLength={500} value={postText} onChange={(event) => setPostText(event.target.value)} placeholder="A walk at lunch, a yoga session, a new goal…" />
                  {imagePreview && <div className="sh-image-preview"><img src={imagePreview} alt="Selected image preview" /><button type="button" className="btn o" onClick={() => { setImageFile(null); setImagePreview(""); }}>Remove image</button></div>}
                  <div className="row sp sh-composer-actions">
                    <label className="sh-select-label">Post type
                      <select value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
                        <option>Daily moment</option>
                        <option>Wellbeing</option>
                        <option>Milestone</option>
                      </select>
                    </label>
                    <button type="button" className="chip sh-image-button" onClick={() => imageInput.current?.click()}><Ic n="image" s={16} />{imageFile ? "Change image" : "Attach image"}</button>
                    <span className="hint sh-image-hint">Up to 10 MB</span>
                    <span className="hint">{postText.length}/500</span>
                    <button className="btn sh-btn" disabled={(!postText.trim() && !imageFile) || posting}>{posting ? "Sharing…" : "Share post"}</button>
                  </div>
                </form>
                {posts.map((post) => <SheroesPost key={post.id} post={post} user={user} />)}
                {!posts.length && <div className="card empty"><Ic n="heart" s={28} /><b>No posts yet</b><span>Be the first to share a Sheroes moment.</span></div>}
              </main>
              <aside className="sh-rail">
                <div className="card bd sh-prompt">
                  <div className="sh-rail-icon"><Ic n="trophy" /></div>
                  <h3>Better together</h3>
                  <p>Join a community challenge, or create one for an activity you enjoy.</p>
                  <button className="btn sh-btn w" onClick={() => setTab("Challenges")}>Explore challenges</button>
                </div>
                <div className="card bd sh-guidelines"><b>A little encouragement goes a long way</b><p>Celebrate progress, respect everyone's pace, and keep personal information private.</p></div>
              </aside>
            </div>
          )}

          {tab === "Challenges" && (
            <div className="sh-challenge-layout">
              <div className="sh-challenge-intro"><div><h2>Open challenges</h2><p>Join in, log your progress, and encourage the community.</p></div><span className="pill sh-pill">{challenges.length} {challenges.length === 1 ? "challenge" : "challenges"}</span></div>
              <details className="card sh-create-challenge">
                <summary><span className="sh-add-icon"><Ic n="plus" s={18} /></span><span><b>Create a challenge</b><small>Set a friendly goal and invite everyone to join</small></span></summary>
                <form className="sh-challenge-form" onSubmit={publishChallenge}>
                  <label>Challenge name<input maxLength={80} required value={challengeForm.title} onChange={(event) => setChallengeForm({ ...challengeForm, title: event.target.value })} placeholder="e.g. Our lunchtime walking week" /></label>
                  <label>Description <span className="hint">(optional)</span><textarea maxLength={300} value={challengeForm.description} onChange={(event) => setChallengeForm({ ...challengeForm, description: event.target.value })} placeholder="Tell people what the challenge is about" /></label>
                  <div className="sh-form-grid">
                    <label>Activity<input maxLength={50} required value={challengeForm.activity} onChange={(event) => setChallengeForm({ ...challengeForm, activity: event.target.value })} placeholder="e.g. walking steps, yoga sessions, meditation minutes" /></label>
                    <label>Target<input type="number" min="1" max="1000000" step="1" required value={challengeForm.target} onChange={(event) => setChallengeForm({ ...challengeForm, target: event.target.value })} /></label>
                    <label>Starts<input type="date" required value={challengeForm.startDate} onChange={(event) => setChallengeForm({ ...challengeForm, startDate: event.target.value })} /></label>
                    <label>Ends<input type="date" required min={challengeForm.startDate} value={challengeForm.endDate} onChange={(event) => setChallengeForm({ ...challengeForm, endDate: event.target.value })} /></label>
                  </div>
                  <div className="row sp"><span className="hint">Progress is shared with Sheroes members.</span><button className="btn sh-btn" disabled={creatingChallenge}>{creatingChallenge ? "Creating…" : "Publish challenge"}</button></div>
                </form>
              </details>
              {challenges.map((challenge) => <SheroesChallenge key={challenge.id} challenge={challenge} user={user} />)}
              {!challenges.length && <div className="card empty"><Ic n="trophy" s={28} /><b>No challenges yet</b><span>Create the first one and invite others to join.</span></div>}
            </div>
          )}

          {tab === "My activity" && (
            <div className="sh-activity">
              <div className="sh-challenge-intro"><div><h2>Your Sheroes activity</h2><p>Your posts and challenges are gathered here.</p></div></div>
              {posts.filter((post) => post.authorId === (user.uid || user.email)).map((post) => <SheroesPost key={post.id} post={post} user={user} />)}
              {challenges.filter((challenge) => challenge.ownerId === (user.uid || user.email)).map((challenge) => <SheroesChallenge key={challenge.id} challenge={challenge} user={user} />)}
              {!posts.some((post) => post.authorId === (user.uid || user.email)) && !challenges.some((challenge) => challenge.ownerId === (user.uid || user.email)) && (
                <div className="card empty"><Ic n="star" s={28} /><b>Your story starts here</b><span>Share a post or create a challenge to see your activity.</span></div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SheroesPost({ post, user }) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uid = user.uid || user.email;
  const liked = (post.likedBy || []).includes(uid);
  const comments = post.comments || [];
  const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
  const time = Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  const toggleLike = async () => {
    setError("");
    try {
      await sheroesService.toggleLike(post.id, uid);
    } catch (reason) {
      setError(reason.message);
    }
  };
  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      await sheroesService.addComment(post.id, user, comment);
      setComment("");
      setShowComments(true);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card sh-post">
      <header className="sh-post-header">
        <Av n={post.author} s={42} src={post.authorId === uid ? user.avatar : undefined} />
        <div className="sh-post-by"><b>{post.author}</b><span>{time}</span></div>
        <span className="pill sh-pill">{post.category}</span>
      </header>
      {post.text && <p className="sh-post-text">{post.text}</p>}
      {post.imageUrl && <img className="sh-post-image" src={post.imageUrl} alt={`${post.author}'s Sheroes post`} loading="lazy" />}
      {error && <div className="sh-error" role="alert">{error}</div>}
      <div className="sh-post-actions">
        <button className={liked ? "liked" : ""} aria-pressed={liked} onClick={toggleLike}><Ic n="heart" f={liked} s={18} />{post.likes || 0} {post.likes === 1 ? "like" : "likes"}</button>
        <button aria-expanded={showComments} onClick={() => setShowComments(!showComments)}><Ic n="comment" s={18} />{comments.length} {comments.length === 1 ? "comment" : "comments"}</button>
      </div>
      {showComments && (
        <div className="sh-comments">
          {comments.map((item, index) => {
            const values = Array.isArray(item) ? item : [item.author || "Member", item.text || ""];
            return <p key={`${values[0]}-${index}`}><b>{values[0]}</b> {values[1]}</p>;
          })}
          <form className="sh-comment-form" onSubmit={addComment}>
            <input maxLength={500} aria-label="Write a comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add an encouraging comment…" />
            <button className="btn sh-btn" disabled={!comment.trim() || busy}>{busy ? "Sending…" : "Post"}</button>
          </form>
        </div>
      )}
    </article>
  );
}

function SheroesChallenge({ challenge, user }) {
  const { tt } = useUI();
  const [participant, setParticipant] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [progressInput, setProgressInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activity = challenge.activity || "activity";
  const isWalking = /walk|step/i.test(activity);
  const endsAt = challenge.endDate < today();
  const percent = participant ? Math.min(100, Math.round((participant.progress / challenge.target) * 100)) : 0;

  useEffect(() => sheroesService.subscribeParticipant(
    challenge.id,
    user.uid || user.email,
    setParticipant,
    setLeaders,
    (reason) => setError(reason.message)
  ), [challenge.id, user.uid, user.email]);

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await sheroesService.joinChallenge(challenge.id, user);
      tt("You joined the challenge");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const saveProgress = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sheroesService.updateProgress(challenge.id, user, progressInput);
      setProgressInput("");
      tt("Progress updated");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card sh-challenge-card">
      <div className="sh-challenge-top">
        <span className="sh-challenge-icon"><Ic n={isWalking ? "compass" : "star"} /></span>
        <div className="sh-challenge-title"><h3>{challenge.title}</h3><span>Started by {challenge.owner}</span></div>
        <span className="sh-pill pill">{endsAt ? "Ended" : `Ends ${new Date(`${challenge.endDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}`}</span>
      </div>
      {challenge.description && <p className="sh-challenge-description">{challenge.description}</p>}
      <div className="sh-challenge-facts">
        <span><b>{Number(challenge.target).toLocaleString()}</b> {activity} goal</span>
        <span><b>{challenge.participantCount || 0}</b> {challenge.participantCount === 1 ? "participant" : "participants"}</span>
      </div>
      {participant ? (
        <div className="sh-progress">
          <div className="row sp"><b>Your progress</b><span>{Number(participant.progress).toLocaleString()} / {Number(challenge.target).toLocaleString()} {activity}</span></div>
          <div className="sh-progress-track" role="progressbar" aria-label="Your challenge progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${percent}%` }} /></div>
          {!endsAt && (
            <form className="sh-progress-form" onSubmit={saveProgress}>
              <label>Update your total {activity.toLowerCase()}
                <input type="number" min="0" max="1000000" step="1" required value={progressInput} onChange={(event) => setProgressInput(event.target.value)} placeholder={String(participant.progress)} />
              </label>
              <button className="btn sh-btn" disabled={busy || progressInput === ""}>{busy ? "Saving…" : "Update"}</button>
            </form>
          )}
        </div>
      ) : (
        <button className="btn sh-btn" disabled={busy || endsAt} onClick={join}>{endsAt ? "Challenge ended" : busy ? "Joining…" : "Join challenge"}</button>
      )}
      {leaders.length > 0 && (
        <div className="sh-leaderboard">
          <b>Community progress</b>
          {leaders.map((leader, index) => <div key={leader.uid} className="row sp"><span>{index + 1}. {leader.name}{leader.uid === (user.uid || user.email) ? " (you)" : ""}</span><span>{Number(leader.progress).toLocaleString()} {activity}</span></div>)}
        </div>
      )}
      {error && <div className="sh-error" role="alert">{error}</div>}
    </article>
  );
}
