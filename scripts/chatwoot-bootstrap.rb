# Executed through Chatwoot's Rails runner, before the web service is exposed.
# Subsequent deployments do not reset passwords or create duplicate accounts.
unless User.exists?
  AccountBuilder.new(
    account_name: 'Urban Barnacle',
    user_full_name: 'Urban Barnacle Admin',
    email: ENV.fetch('CHATWOOT_ADMIN_EMAIL'),
    user_password: ENV.fetch('CHATWOOT_ADMIN_PASSWORD'),
    super_admin: true,
    confirmed: true
  ).perform
end

raise 'No Chatwoot administrator exists' unless SuperAdmin.exists?

Redis::Alfred.delete(Redis::Alfred::CHATWOOT_INSTALLATION_ONBOARDING)
puts 'Chatwoot administrator ready; public onboarding disabled.'
