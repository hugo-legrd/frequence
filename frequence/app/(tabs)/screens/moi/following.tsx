import FollowListScreen from "../../../../lib/components/FollowListScreen";

export default function MyFollowing() {
  return (
    <FollowListScreen
      title="Abonnements"
      kind="following"
      emptyText="Tu ne suis personne pour l'instant."
      backHref="/(tabs)/screens/moi/moi"
    />
  )
}