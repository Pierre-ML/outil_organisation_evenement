import { execSync } from "child_process";

const CONFIG = {
  vps: "ubuntu@51.77.146.56",
  remotePath: "/var/www/site/soiree",
  serviceName: "soiree",
  buildCommand: "npm run build",
};

const SSH = `ssh -o BatchMode=yes -o LogLevel=ERROR ${CONFIG.vps}`;
const SCP = `scp -o BatchMode=yes -o LogLevel=ERROR`;

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

try {
  console.log("🔨 Build en cours...");
  run(CONFIG.buildCommand);

  console.log("⏹️  Arrêt du service...");
  run(`${SSH} "sudo systemctl stop ${CONFIG.serviceName}"`);

  console.log("📦 Envoi sur le VPS...");
  run(`${SCP} -r ./dist ${CONFIG.vps}:${CONFIG.remotePath}/`);
  run(`${SCP} package.json package-lock.json ${CONFIG.vps}:${CONFIG.remotePath}/`);

  console.log("📥 Installation des dépendances...");
  run(`${SSH} "cd ${CONFIG.remotePath} && npm install --omit=dev --prefer-offline"`);

  console.log("▶️  Démarrage du service...");
  run(`${SSH} "sudo systemctl start ${CONFIG.serviceName}"`);

  console.log("✅ Déployé avec succès !");

} catch (err) {
  console.error("❌ Erreur lors du déploiement :", err.message);
  process.exit(1);
}
