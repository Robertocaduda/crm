-- CreateTable
CREATE TABLE "MarketingList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingListMember" (
    "listId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingListMember_pkey" PRIMARY KEY ("listId","contactId")
);

-- AddForeignKey
ALTER TABLE "MarketingListMember" ADD CONSTRAINT "MarketingListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "MarketingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingListMember" ADD CONSTRAINT "MarketingListMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
