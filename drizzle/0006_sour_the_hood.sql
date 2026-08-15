CREATE TABLE `jarvisWorkspaceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(700) NOT NULL,
	`name` varchar(255) NOT NULL,
	`itemType` enum('file','folder') NOT NULL,
	`storageKey` varchar(1024),
	`contentType` varchar(160),
	`sizeBytes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jarvisWorkspaceItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `jarvisWorkspaceUserPathUnique` UNIQUE(`userId`,`path`)
);
--> statement-breakpoint
CREATE INDEX `jarvisWorkspaceUserUpdatedIdx` ON `jarvisWorkspaceItems` (`userId`,`updatedAt`);