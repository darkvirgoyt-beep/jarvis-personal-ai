CREATE TABLE `jarvisResearchRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`topic` varchar(500) NOT NULL,
	`sourceLedger` text NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jarvisResearchRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `jarvisResearchUserCreatedIdx` ON `jarvisResearchRecords` (`userId`,`createdAt`);