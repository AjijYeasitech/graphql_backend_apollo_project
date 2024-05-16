const User = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    picture: {
      type: DataTypes.STRING,
      defaultValue:
        "https://res.cloudinary.com/demo/image/upload/d_avatar.png/non_existing_id.png",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Hey there ! I am using whatsapp",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  User.associate = function (models) {
    User.hasMany(models.Message, {
      foreignKey: "userId",
    });
    User.hasMany(models.Conversation, {
      foreignKey: "userId",
    });
    User.hasMany(models.Conversation, { foreignKey: "receiverId" });
    User.hasOne(models.Conversation, { foreignKey: "adminId" });
  };
  return User;
};

export default User;
