const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const Client = require('ssh2').Client;


class Publish {
	constructor(config) {
		/*
		* ip
		* port
		* username
		* privateKey
		* passphrase
		*
		* local: ''
		* remote: ''
		* ignore: []
		* clear: true/false
		* cmds: []
		* */
		this.config = Object.assign({}, config);
		this.connection = undefined;
		this.sftp = undefined;
		this.config.ignore = (this.config.ignore || []).map(p => {
			if (path.isAbsolute(p)) {
				return path.normalize(p)
			}
			return path.resolve(this.config.local, p);
		});
		this.config.privateKey = fs.readFileSync(this.config.privateKey, 'utf-8');
	}

	async getConnection() {
		if (this.connection) return this.connection;
		const con = new Client();
		return new Promise((resolve, reject) => {
			con.on('ready', ()=> {
				this.connection = con;
				return resolve(con);
			});
			con.on('error', (error) => {
				console.log(`getConnection error`);
				console.log(error);
				return reject(error);
			});
			con.connect(this.config);
		});
	}

	async getSftp() {

		if (!this.connection) await this.getConnection();
		if (this.sftp) return this.sftp;
		this.sftp = await promisify(this.connection.sftp).call(this.connection);
	}

	async ensureRemoteDir(dirPath) {
		await this.getConnection();
		await this.getSftp();
		return new Promise((resolve, reject) => {
			this.sftp.exists(dirPath, (exists)  => {
				if (exists) return resolve();
				this.execCmd(`mkdir -p ${dirPath}`).then(resolve).catch(reject);
			});
		});
	}

	async uploadFile(from, dest) {
		if (this.ignorePath(from)) return ;
		await this.getSftp();
		console.log(`upload ${from} to ${dest}`);
		const data = await promisify(fs.readFile).call(fs, from);
		await promisify(this.sftp.writeFile).call(this.sftp,  dest, data);
	}

	async uploadDir(from, dest) {
		if (this.ignorePath(from)) return;
		await this.ensureRemoteDir(dest);
		const files = await promisify(fs.readdir).call(fs, from);

		for (let i=0; i<files.length; i++) {
			const file = files[i];
			const stat = await promisify(fs.stat).call(fs, path.resolve(from, file));
			if (stat.isDirectory()) {
				await this.uploadDir(path.resolve(from, file), path.resolve(dest, file))
			} else if (stat.isFile()) {
				await this.uploadFile(path.resolve(from, file), path.resolve(dest, file));
			}
		}

		// await Promise.all(files.map(async file => {
		// 	const stat = await promisify(fs.stat).call(fs, path.resolve(from, file));
		// 	if (stat.isDirectory()) {
		// 		await this.uploadDir(path.resolve(from, file), path.resolve(dest, file))
		// 	} else if (stat.isFile()) {
		// 		await this.uploadFile(path.resolve(from, file), path.resolve(dest, file));
		// 	}
		// }));
	}

	async execCmd(cmd) {
		await this.getConnection();
		const stream = await promisify(this.connection.exec).call(this.connection, cmd);
		return new Promise((resolve, reject) => {
			let data = '';
			let err = '';
			stream.on('data', chunk => {
				data += chunk;
			}).stderr.on('data', chunk => {
				err += chunk;
			}).on('close', () => {
				if (err) console.error(`execCmd error ${cmd}`);
				if (err) return reject(err);
				return  resolve(data);
			});
		});
	}

	ignorePath(checkPath) {
		return this.config.ignore.includes(path.normalize(checkPath))
	}

	async execCmds() {
		const { cmds } = this.config;
		if (!cmds || cmds.length <= 0) return ;
		let ret = [];
		for (let i = 0; i < cmds.length; i++) {
			ret.push(await this.execCmd(cmds[i]));
		}
		return ret;
	}

	async publish() {
		try {
			if (this.config.clear) await this.execCmd(`rm -rf ${this.config.remote} && echo clear success`);
			const stat = await promisify(fs.stat).call(fs, this.config.local);
			if (stat.isDirectory()) {
				await this.uploadDir(this.config.local, this.config.remote);
			} else if (stat.isFile()) {
				await this.uploadFile(this.config.local, this.config.remote);
			} else {
				throw new Error('unsupported upload type')
			}
			const res = await this.execCmds();
			res.forEach(m => console.log(m));
			this.destroy();
		} catch (e) {
			console.log(e);
			this.destroy();
			throw e;
		}

	};

	destroy() {
		if (this.connection && typeof this.connection.end === 'function') this.connection.end();
		this.connection = undefined;
		if (this.sftp) this.sftp = undefined;
	}
}


module.exports = Publish;
