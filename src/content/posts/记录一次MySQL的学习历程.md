---
title: 记录一次MySQL的学习历程
description: 数据库五个组成部分 数据库服务器 数据库 数据表 数据字段 数据行 SQL语句划分 DDL(Data Defintion Language)，数据定义语句，用于定义不同的数据段、数据库、表、列、索引等，关键字包括create、drop、al
publishedAt: 2021-08-19
category: 编程开发
tags:
  - "Database"
  - "mysql"
  - "数据库"
  - "数据库教程"
  - "sql"
draft: false
featured: false
updatedAt: 2021-08-19
cover: /images/posts/记录一次MySQL的学习历程/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 前提知识

数据库五个组成部分

-   数据库服务器
-   数据库
-   数据表
-   数据字段
-   数据行

SQL语句划分

-   `DDL(Data Defintion Language)`，数据定义语句，用于定义不同的数据段、数据库、表、列、索引等，关键字包括`create、drop、alter`等
-   `DML(Data Manipulation Language)`，数据操纵语句，用于添加、删除、更新、查询数据库记录，并检查数据的完整性。常用语句的关键字包括`insert、delete、update、select`等
-   `DCL(Data Control Language)`，数据控制语句，用于控制不同数据段直接的许可和访问级别，用来定义数据库、表、字段、用户的访问权限和安全级别，常用的关键字包括`grant、revoke`等

## 一、数据库操作

连接MySQL

```bash
mysql -h localhost -u root -p

# -h 表示数据库连接地址
# -u 表示登录用户
# -p 表示使用的密码
```

创建数据库

```bash
create database chaos-database
```

查看所有数据库

```bash
show databases
```

选中使用数据库

```bash
use chaos-database
```

删除数据库

```bash
drop database chaos-database
```

## 二、数据表操作

创建表

```bash
create table chaos-table(username varchar(20),password varchar(32))
```

删除表

```bash
drop table chaos-table
```

修改表名

```bash
alter table chaos-table rename chaos-table2
# 将chaos-table表改为chaos-table2
```

指定表引擎和字符表

-   指定表引擎，常用MyISAM或InnoDB
    
    ```bash
    ENGINE = InnoDB
    ```
    
-   指定默认字符集
    
    ```bash
    DEFAULT CHARSET = utf8
    ```
    
效果如下

```bash
create table chaos-table(username varchar(20),password varchar(32)) ENGINE=InnoDB CHARSET=utf8
```

## 三、数据字段操作

修改表的字段类型

```bash
alter table chaos-table modify username varchar(20)
```

增加表字段

```bash
alter table chaos-table add column age int(3)
```

增加字段时控制字段顺序

```bash
alter table chaos-table add column age int(3) after username
# 在username字段后添加一个age字段

alter table chaos-table add column age int(3) first
# 在表的最开始位置增加一个age字段
```

删除表字段

```bash
alter table chaos-table drop column age
# 在chaos-table中删除age字段
```

表字段改名

```bash
alter table chaos-table change age age2 int(2)
# 将chaos中age字段改名为age2，类型为长度2的int类型
```

修改表字段的顺序

```bash
alter table chaos-table modify age int(4) first
# 将age字段修改为int(4)，并放在表的首位

# 支持的行为有
# -- modify, change, add
# -- first, after 
```

## 四、数据类型

数据类型

-   数值类型，整型、浮点型
-   字符串类型
-   日期类型
-   复合类型，枚举、集合
-   空间类型（非科学性工作基本不用，不做讲解）

字段的其他属性

-   无符号， unsigned，即不为负数
-   0填充， zerofill
-   默认值，default
-   null
-   非null，not null

```sql
create table if not exists chaos-table(
	id int(10) not null,
	age int(3) unsigned,
	width float(4,2) default 1000.00,
	height int(10) null
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

MySQL数据类型总表  
![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-01.webp)

### 1\. 数值类型

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-02.webp)

### 2\. 字符串类型

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-03.webp)

### 3\. 时间类型

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-04.webp)

### 3\. 复合类型

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-05.webp)

## 五、字符集、引擎和索引

**字符集**

-   **ASCII** 美国标准信息交换码 1Byte
-   **GBK** 汉字内码扩展规范 2Byte
-   **Unicode** 万国码 4Byte
-   **UTF-8** Unicode的可变长度字符编码 \[1, 6\]Byte

**表引擎**

-   **MyISAM** ✅ 常用，读取效率很高
-   **InnoDB** ✅ 常用，写入、支持事物（回滚操作）
-   ~Archive~ ❌
-   ~NDB~ ❌

索引

-   **index 普通索引**
-   **unique 唯一索引**
-   **fulltext 全文索引**
-   **primary key 主键索引**

添加索引

```sql
alter table chaos-table add index(username)
# 为chaos-table表的username字段添加普通索引

alter table chaos-table add unique(username)
# 为chaos-table表的username字段添加普通索引

alter table chaos-table add fulltext(username)
# 为chaos-table表的username字段添加普通索引

alter table chaos-table add primary key(username)
# 为chaos-table表的username字段添加普通索引

create table chaos-table(
	username varchar(20) not null
	password int nor null,
	email varchar(20),
	content text,
	index pw(password),
	unique (username),
	fulltext(content)
) ENGINE=InnoDB
# 索引可以在创建表时指定
#   -- 索引类型 [索引名](字段)
#   -- 索引类型 (字段)
```

## 六、增删改查

**测试表chaos-table**  
![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-06.webp)

### 1\. 插入记录

```sql
insert intio chaos-table values(value1, value2, value3)
# insert intio chaos-table values("李四", 258369, "lisi@qq.com")
# 按照表字段默认顺序插入值

insert intio chaos-table(field1, field2, field3) values(value1, value2, value3)
# insert intio chaos-table(username,password, email) values("李四", 258369, "lisi@qq.com")
# 按照表字段声明的顺序插入值
```

### 2\. 查询记录

**查询记录**

```sql
select * from chaos-table
# 从chaos-table表中检索所有记录

select field1,filed2 from chaos-table
# select username,password from chaos-table
# 从chaos-table表中检索username，password两个字段
```

**查询单个字段不重复记录**

```sql
select distinct field1 from chaos-table
# 查询chaos-table表中 field1字段中不重复的所有结果
```

### 3\. 条件查询 where

-   比较运算符
    
    ```sql
    >  >=  <  <=  =  !=
    # 大于、大于等于、小于、小于等于、等于、不等于
    ```
    
-   逻辑运算符
    
    ```sql
    or and
    # 或者，并且
    ```
    
示例

```sql
select file1 from chaos-table where 条件
# 查询某个字段中满足条件的集合

select * from chaos-table where 条件
# 查询某个表中满足条件的集合

select * from chaos-table where 条件1 or 条件2 and 条件3
# 多条件组合查询

# select * from chaos-table where username="李一"
# select id from chaos-table where id>10
```

### 4\. 查询结果排序

关键字 keyword

-   asc 升序，从小到大、默认
-   desc 降序，从大到小

使用方式 `order by field keyword`

```sql

select * from chaos-table where id>10 order by username desc
# 单字段排序, 先从表中筛选出id>10的集合，然后按照username降序排列

select * from chaos-table order by username desc password asc email desc
# 多字段排序，靠前的字段先排序，如果有未区分开的按照字段再排序
```

### 5\. 查询结果分组

查询结果分组 `group by field`

```sql
select * from chaos-table group by tag
# 根据tag进行分组

select count(tag),tag from chaos-table group by tag
# 根据tag进行分组，并且显示组别数量
```

在分组基础上进行统计 `with rollup`

```sql
select * from chaos-table group by tag with rollup
# 根据tag进行分组，并且显示组别数量，with rollup会统计没有被划分至组的其他行
```

结果再过滤 `having` , 和`where`类似，`where`用于筛选记录，`having`用于筛选组

```sql
select count(tag),tag from chaos-table group by tag having count(tag)>3
# 根据tag进行分组，并且显示组别数量，并且只展示个数大于3的组别
```

### 6\. 查询结果限制

**查询结果特定数量限制。** 使用方式 `limit number`

```sql
select * from chaos-table limit 10
# 只展示满足条件的10行数据

select * from chaos-table where id>10 order by username desc limit 5
# 排序结果只展示5行数据
```

**查询结果区间限制。** 使用方式 `limit index,number` ，index为起始值，number为数量，比如index=1，number=3，则会搜到 `{1,2,3}`

```sql
select * from chaos-table order by id asc limit 0,3
# 只展示满足条件的3行数据, id为{1,2,3}

select * from chaos-table order by id asc limit 3,4
# 只展示满足条件的4行数据, id为{4,5,6,7}
```

### 7\. 统计函数

常用统计函数

-   `sum` 求和
-   `count` 总个数
-   `max` 最大值
-   `min` 最小值
-   `avg` 平均值

```sql
select func(field) from chaos-table
# select count(username) from chaos-table
# select sum(password) from chaos-table
# 获取表中某个字段的 和、总个数、最大值、最小值、平均值

select count(username) as geshu from chaos-table
# 可以将统计函数起一个别名
```

### 8\. 查询综合使用

综合使用查询语句 `select [字段] [*] [函数(字段)] from 表名 [where 条件] [group by 字段] [having 条件] [order by 字段 关键字] [limit 条件]`

### 9\. 更新记录

**更新单表字段**

-   使用方式， `update 表名 set 字段1=值1，字段2=值2 where 条件`
    
    ```sql
    update money set balance=blance-5000, username="lulu" where uid=15
    # 将uid=15的字段中的balance字段值减少500,username更改为"lulu"
    ```
    
**更新多表字段**

-   使用方式，`update 表名1 表名2 set 表名1.字段1=值1，表名2.字段2=值2 where 条件`
    
    ```sql
    update money-n n money-m m set n.balance=n.blance-5000, m.username="lulu" where uid=15
    # 同时更新多表字段，表名可以简写
    ```
    
### 10\. 删除记录

使用方式

-   delete `delete from 表名 [where 条件]`
-   truncate `truncate table 表名 [where 条件]`

```sql
delete from user where id>10
# 删除用户表中id大于10的所有用户

truncate table user 
# 清空表，重新从1开始计算
```

delete和truncate都可以清空表记录

-   delete，**表的id会从当前id开始计算**
-   truncate，**表的id会从1重新递增**

**删除前一定要备份！！**

## 七、多表联合查询

多表联合查询的本质是：表连接

-   `内连接`
-   `外连接`

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-07.webp)

### 1\. 内连接

两张表中拥有相同字段，例如 `服饰表中用户uid` 和 `手机表中用户uid` 相同，通过内连接可以组合两张表中相同的部分，成为一张新表

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-08.webp)

```sql

select clothing.uid as uid, clothing.clothingid as clothingid, clothingid.username as username, 
	phone.uid as uid, phone.phoneid as phoneid, phone.username as username from Clothing_Table clothing, Phone_Table phone where clothing.uid=phone.uid
# 方式一、 where条件语句，表名可以简写

select Clothing_Table.uid as uid, Clothing_Table.clothingid as Clothing_Table, clothingid.username as username, 
	Phone_Table.uid as uid, Phone_Table.phoneid as phoneid, Phone_Table.username as username from Clothing_Table inner join Phone_Table on Clothing_Table.uid=Phone_Table.uid
# 方式二、inner join条件语句，表名不能简写
```

### 2\. 外连接

外连接分为`左连接`和`右连接` ，用法

-   `左连接`，**包含左表所有记录和右表所有记录，不存在则以NULL填充**，`table1 left join table2 on 条件`
-   `右连接`，**包含右表所有记录，左表满足要求的记录，不存在则以NULL填充**，`table1 rightjoin table2 on 条件`

```sql
select * from Clothing_Table left join Phone_Table on Clothing_Table.uid=Phone_Table.uid
# 左连接连接两张表，左表和右表都记录，不存在则以NULL填充
```

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-09.webp)

```sql
select * from Clothing_Table right join Phone_Table on Clothing_Table.uid=Phone_Table.uid
# 右连接连接两张表，记录右表所有，记录左表满足条件的，不存在则以NULL填充
```

![在这里插入图片描述](/images/posts/记录一次MySQL的学习历程/image-10.webp)

### 3\. 记录联合

关键字，使用方式 `result1 union [all] result2`

-   `union`，联合且去重
-   `union all`，直接联合，没有去重

```sql
select uid from table1 union select uid from table2
# 将table1表中uid字段和table2中uid字段联合
```

## 八、DCL语句

用户权限

-   grant，添加权限
-   revoke，删除权限

权限类别

-   select，insert，update，modify

### 1\. 添加权限

```sql
grant 权限 on 数据库.表 to "用户名"@"主机" identified by "密码"
# grant select, inster on chaos-database.TestData to "chao9441"@"gis2all.esri.com" 
#  indentified by "Abc@12345678"

# 给予chao9441在gis2all机器连接的chaos-database数据库中TestData表的查询和写入权限

# chaos-database.* 代表所有表
# grant all on ... 代表给予所有权限，需慎重
```

### 2\. 删除权限

```sql
revoke 权限 on 数据库.表 from "用户名"@"主机"
# revoke insert on chaos-databse.TestData from "chao9441"@"gis2all.esri.com"

# 移除chao9941用户在gis2all机器上的chaos-database数据库中TestData表的写入权限

# revoke all on .. 代表移除所有权限，需慎重
```

## 辅助工具

vscode-database-client

[使用教程](https://github.com/cweijan/vscode-database-client/blob/master/README_CN.md)
