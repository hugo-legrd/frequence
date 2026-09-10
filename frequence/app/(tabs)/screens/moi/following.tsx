import FollowListScreen from "../../../components/FollowListScreen";

export default function MyFollowing() {
  return (
    <FollowListScreen
      title="Abonnements"
      kind="following"
      emptyText="Tu ne suis personne pour l'instant."
    />
  )
}