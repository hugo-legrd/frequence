import FollowListScreen from "../../../components/FollowListScreen";

export default function MyFollowers() {
  return (
    <FollowListScreen
      title="Abonnés"
      kind="followers"
      emptyText="Personnes ne te suit pour l'instant."
    />
  );
}