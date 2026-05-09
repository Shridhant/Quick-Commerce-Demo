import bycrypt from 'bcryptjs'

export const encryptPassword = async (password : string) => {
  const saltRounds = 10;
  try {
    const hashedPassword = await bycrypt.hash(password, saltRounds);

    return hashedPassword;
  } catch (err) {
    throw new Error(`Error hashing password: ${err}`);
  }
};

export const validatePassword = async (password : string,savedPassword : string)=>{
 return await bycrypt.compare(password, savedPassword);
}


