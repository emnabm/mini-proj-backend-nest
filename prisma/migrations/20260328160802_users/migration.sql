-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'ENSEIGNANT', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "TypeAgent" AS ENUM ('ADMINISTRATEUR', 'TECHNICIEN', 'SUPPORT');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "mdp" TEXT NOT NULL,
    "photo" TEXT,
    "roles" "Role" NOT NULL,
    "refreshTokenHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etudiant" (
    "id" SERIAL NOT NULL,
    "numINSCR" INTEGER NOT NULL,
    "filiere" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "groupe" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "id" SERIAL NOT NULL,
    "specialite" TEXT NOT NULL,
    "nbhSurveillance" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "type" "TypeAgent" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_numINSCR_key" ON "Etudiant"("numINSCR");

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_userId_key" ON "Etudiant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enseignant_userId_key" ON "Enseignant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseignant" ADD CONSTRAINT "Enseignant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
