CREATE TABLE `jarvisMobilePairings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`verifierHash` varchar(128) NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`exchangedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jarvisMobilePairings_id` PRIMARY KEY(`id`),
	CONSTRAINT `jarvisMobilePairings_codeHash_unique` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE INDEX `jarvisMobilePairingExpiryIdx` ON `jarvisMobilePairings` (`expiresAt`);