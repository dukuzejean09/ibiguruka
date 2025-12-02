// MongoDB script to create admin user
db = db.getSiblingDB("neighborwatch");

// Delete all users
db.users.deleteMany({});

// Insert admin user with pre-hashed password for "Admin123"
db.users.insertOne({
  email: "admin@neighborwatch.rw",
  password_hash: "$2b$12$SMO1gqdAOjhPnQVWWHcnYO3gb2LpnN9ft86MvThnO5ljQMhp2IgOu",
  full_name: "System Administrator",
  name: "System Administrator",
  phone: "+250788000000",
  role: "admin",
  verified: true,
  blocked: false,
  role_approved: true,
  created_at: new Date(),
});

print("✅ Admin user created successfully!");
print("Email: admin@neighborwatch.rw");
print("Password: Admin123");
