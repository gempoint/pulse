defmodule RealtimeEx.Repo do
  use Ecto.Repo,
    otp_app: :realtime_ex,
    adapter: Ecto.Adapters.Postgres
end
